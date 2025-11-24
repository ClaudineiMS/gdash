package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"github.com/joho/godotenv"
	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherMessage struct {
	City               string   `json:"city"`
	TimestampUTC       string   `json:"timestamp_utc"`
	TemperatureC       *float64 `json:"temperature_c,omitempty"`
	HumidityPct        *int     `json:"humidity_pct,omitempty"`
	WindSpeedKmh       *float64 `json:"wind_speed_kmh,omitempty"`
	ConditionText      *string  `json:"condition_text,omitempty"`
	RainProbabilityPct *int     `json:"rain_probability_pct,omitempty"`
}

var (
	rabbitURL = getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
	queueName = getenv("QUEUE_NAME", "weather_queue")
	prefetch  = getenvInt("PREFETCH_COUNT", 1)
)

func main() {
	_ = godotenv.Load()

	log.Println("▶ Iniciando worker...")

	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatalf("Falha ao conectar com RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Falha ao abrir canal: %v", err)
	}
	defer ch.Close()

	// Declara fila 
	_, err = ch.QueueDeclare(
		queueName,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Falha ao declarar fila: %v", err)
	}

	// QoS / prefetch
	if err := ch.Qos(prefetch, 0, false); err != nil {
		log.Fatalf("Falha ao definir QoS: %v", err)
	}

	consumerTag := fmt.Sprintf("go-worker-%d", os.Getpid())

	msgs, err := ch.Consume(
		queueName,
		consumerTag,
		false, 
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Falha ao registrar consumidor: %v", err)
	}

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		for d := range msgs {
			var m WeatherMessage
			if err := json.Unmarshal(d.Body, &m); err != nil {
				log.Printf("Falha ao parsear JSON: %v", err)
				_ = d.Ack(false) // descarta mensagem malformada
				continue
			}

			// Formata JSON com identação
			formattedJSON, err := json.MarshalIndent(m, "", "  ")
			if err != nil {
				log.Printf("Falha ao formatar JSON: %v", err)
				_ = d.Ack(false)
				continue
			}

			log.Println("Mensagem recebida (Raw JSON formatado):")
			log.Println(string(formattedJSON))

			_ = d.Ack(false)
			log.Println("Mensagem confirmada")
		}
		log.Println("Canal de mensagens fechado")
	}()

	log.Printf("✔ Worker iniciado, ouvindo fila '%s' (consumer tag=%s). PREFETCH=%d", queueName, consumerTag, prefetch)
	<-sigc
	log.Println("Sinal de desligamento recebido, finalizando worker...")
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
