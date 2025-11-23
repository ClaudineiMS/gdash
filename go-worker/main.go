package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
)

/*
Expectativa de mensagem (exemplo):
{
  "city": "Belo Horizonte",
  "timestamp_utc": "2025-11-22T03:38:00Z",
  "temperature_c": 21.5,
  "humidity_pct": 76,
  "wind_speed_kmh": 10.4,
  "condition_text": "Nublado",
  "rain_probability_pct": 42
}
*/

type WeatherMessage struct {
	City               string   `json:"city"`
	TimestampUTC       string   `json:"timestamp_utc"`
	TemperatureC       *float64 `json:"temperature_c,omitempty"`
	HumidityPct        *int     `json:"humidity_pct,omitempty"`
	WindSpeedKmh       *float64 `json:"wind_speed_kmh,omitempty"`
	ConditionText      *string  `json:"condition_text,omitempty"`
	RainProbabilityPct *int     `json:"rain_probability_pct,omitempty"`
}

// Config via env vars (com defaults)
var (
	rabbitURL   = getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
	queueName   = getenv("QUEUE_NAME", "weather_data")
	dlqName     = getenv("DLQ_NAME", "weather_data_dlq")
	nestJSUrl   = getenv("NESTJS_URL", "http://localhost:3000/api/weather/logs")
	maxRetries  = getenvInt("MAX_RETRIES", 3)
	httpTimeout = getenvInt("HTTP_TIMEOUT_SECONDS", 10)
	prefetch    = getenvInt("PREFETCH_COUNT", 1)
)

func main() {
	// Load .env if present
	_ = godotenv.Load()

	log.Println("▶ Starting worker...")

	// Connect to RabbitMQ
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatalf("❌ failed to connect to rabbitmq: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("❌ failed to open channel: %v", err)
	}
	defer ch.Close()

	// Declare main queue (durable)
	_, err = ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // autoDelete
		false, // exclusive
		false, // noWait
		nil,
	)
	if err != nil {
		log.Fatalf("❌ queue declare failed: %v", err)
	}

	// Declare DLQ
	_, err = ch.QueueDeclare(
		dlqName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("❌ dlq declare failed: %v", err)
	}

	// QoS / prefetch
	if err := ch.Qos(prefetch, 0, false); err != nil {
		log.Fatalf("❌ failed to set qos: %v", err)
	}

	msgs, err := ch.Consume(
		queueName,
		"go-worker", // consumer tag
		false,       // autoAck = false -> manual ack/nack
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("❌ failed to register consumer: %v", err)
	}

	// Graceful shutdown handling
	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, syscall.SIGINT, syscall.SIGTERM)

	// Worker goroutine
	forever := make(chan bool)
	go func() {
		for d := range msgs {
			processDelivery(ch, &d)
		}
		// if msgs channel closed, stop loop
		forever <- true
	}()

	log.Printf("✔ Worker started, waiting for messages on queue '%s'...", queueName)

	select {
	case <-sigc:
		log.Println("⏳ shutdown signal received, exiting...")
	case <-forever:
		log.Println("⏳ deliveries channel closed, exiting...")
	}
}

// processDelivery handles one AMQP delivery: validate, send to API, retry or send to DLQ
func processDelivery(ch *amqp.Channel, d *amqp.Delivery) {
	log.Printf("[MSG] Received message (len=%d)", len(d.Body))

	attempts := getAttemptHeader(d.Headers)

	// Validate and transform
	msg, err := validateAndTransform(d.Body)
	if err != nil {
		log.Printf("[ERROR] validation failed: %v — sending to DLQ", err)
		if err2 := publishToQueue(ch, dlqName, d.Body, d.Headers); err2 != nil {
			log.Printf("[ERROR] failed to publish to DLQ: %v", err2)
			_ = d.Nack(false, false) // drop?
		} else {
			_ = d.Ack(false)
		}
		return
	}

	// Send to NestJS
	if err := publishToEndpoint(msg); err != nil {
		log.Printf("[WARN] publishToEndpoint failed (attempt %d): %v", attempts+1, err)

		if attempts+1 <= maxRetries {
			// republish to main queue with incremented attempt header
			newHeaders := cloneHeaders(d.Headers)
			newHeaders["x-attempts"] = attempts + 1

			if err := publishToQueue(ch, queueName, d.Body, newHeaders); err != nil {
				log.Printf("[ERROR] failed to republish for retry: %v", err)
				_ = d.Nack(false, false)
			} else {
				log.Printf("[INFO] republished message for retry (attempt %d). Acking original.", attempts+1)
				_ = d.Ack(false)
			}
		} else {
			// move to DLQ
			log.Printf("[ERROR] max retries reached (%d). Sending to DLQ.", maxRetries)
			if err := publishToQueue(ch, dlqName, d.Body, d.Headers); err != nil {
				log.Printf("[ERROR] failed to publish to DLQ: %v", err)
				_ = d.Nack(false, false)
			} else {
				_ = d.Ack(false)
			}
		}
		return
	}

	// success
	log.Printf("[OK] processed message city=%s timestamp=%s", safeString(msg.City), safeString(msg.TimestampUTC))
	_ = d.Ack(false)
}

// validateAndTransform unmarshals the raw body and performs basic validations/normalizations
func validateAndTransform(raw []byte) (*WeatherMessage, error) {
	var msg WeatherMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		return nil, fmt.Errorf("json unmarshal error: %w", err)
	}

	// city required
	if msg.City == "" {
		return nil, errors.New("missing city")
	}

	// timestamp: if missing or unparsable, replace with now UTC (RFC3339)
	if msg.TimestampUTC == "" {
		now := time.Now().UTC().Format(time.RFC3339)
		msg.TimestampUTC = now
		log.Printf("[WARN] timestamp_utc missing, set to now: %s", now)
	} else {
		if _, err := time.Parse(time.RFC3339, msg.TimestampUTC); err != nil {
			old := msg.TimestampUTC
			msg.TimestampUTC = time.Now().UTC().Format(time.RFC3339)
			log.Printf("[WARN] timestamp_utc parse failed ('%s'), replaced with now: %s", old, msg.TimestampUTC)
		}
	}

	// Example transform: clamp rain probability between 0-100 if present
	if msg.RainProbabilityPct != nil {
		if *msg.RainProbabilityPct < 0 {
			v := 0
			msg.RainProbabilityPct = &v
		} else if *msg.RainProbabilityPct > 100 {
			v := 100
			msg.RainProbabilityPct = &v
		}
	}

	return &msg, nil
}

// publishToEndpoint posts the normalized JSON to the NestJS endpoint with timeout
func publishToEndpoint(msg *WeatherMessage) error {
	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(httpTimeout)*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, nestJSUrl, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("http request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("unexpected status code %d", resp.StatusCode)
	}

	return nil
}

// publishToQueue publishes raw body and headers to a queue
func publishToQueue(ch *amqp.Channel, qName string, body []byte, headers amqp.Table) error {
	pub := amqp.Publishing{
		Headers:      headers,
		ContentType:  "application/json",
		Body:         body,
		DeliveryMode: amqp.Persistent,
		Timestamp:    time.Now(),
	}
	return ch.Publish("", qName, false, false, pub)
}

// Helpers

func getAttemptHeader(headers amqp.Table) int {
	if headers == nil {
		return 0
	}
	if v, ok := headers["x-attempts"]; ok {
		switch t := v.(type) {
		case int:
			return t
		case int32:
			return int(t)
		case int64:
			return int(t)
		case float64:
			return int(t)
		case string:
			if i, err := strconv.Atoi(t); err == nil {
				return i
			}
		}
	}
	return 0
}

func cloneHeaders(h amqp.Table) amqp.Table {
	if h == nil {
		return amqp.Table{}
	}
	clone := amqp.Table{}
	for k, v := range h {
		clone[k] = v
	}
	return clone
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getenvInt(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return def
}

func safeString(s string) string {
	if s == "" {
		return "<empty>"
	}
	return s
}
