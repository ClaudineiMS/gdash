import json
import requests
import os
import pika
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

OPENMETEO_URL = os.getenv("OPENMETEO_URL")
GEOCODE_URL = os.getenv("OPENMETEO_GEOCODE_URL")
CITY = os.getenv("CITY")
RABBITMQ_URL = os.getenv("RABBITMQ_URL")

# ------------------------
# 1 - Buscar latitude/longitude da cidade
# ------------------------
def geocode_city(city_name):
    url = f"{GEOCODE_URL}?name={city_name}&count=1&language=pt&format=json"
    response = requests.get(url)
    data = response.json()

    if "results" not in data:
        raise Exception(f"⚠ Cidade não encontrada: {city_name}")

    result = data["results"][0]
    return result["latitude"], result["longitude"], result["name"]


# ------------------------
# 2 - Coletar dados da API
# ------------------------
def fetch_weather(lat, lon):
    url = (
        f"{OPENMETEO_URL}"
        f"?latitude={lat}&longitude={lon}"
        "&current_weather=true"
        "&hourly=precipitation_probability,relativehumidity_2m"
    )
    response = requests.get(url)
    return response.json()


# ------------------------
# 3 - Traduz weathercode
# ------------------------
WEATHERCODE_MAP = {
    0: "Céu limpo",
    1: "Principalmente limpo",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro depositante",
    51: "Garoa leve",
    53: "Garoa moderada",
    55: "Garoa densa",
    61: "Chuva fraca",
    63: "Chuva moderada",
    65: "Chuva forte",
    71: "Neve leve",
    73: "Neve moderada",
    75: "Neve forte",
    80: "Aguaceiros leves",
    81: "Aguaceiros moderados",
    82: "Aguaceiros violentos",
}


# ------------------------
# 4 - Normalizar dados
# ------------------------
def normalize_weather(city_name, data):
    current = data["current_weather"]
    target_time = current["time"]
    hourly_times = data.get("hourly", {}).get("time", [])

    rain_prob = None
    humidity = None

    if target_time in hourly_times:
        idx = hourly_times.index(target_time)
        rain_prob = data["hourly"]["precipitation_probability"][idx]
        humidity = data["hourly"]["relativehumidity_2m"][idx]

    normalized = {
        "city": city_name,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "temperature_c": current["temperature"],
        "wind_speed_kmh": current["windspeed"],
        "condition_code": current["weathercode"],
        "condition_text": WEATHERCODE_MAP.get(current["weathercode"], "Desconhecido"),
        "rain_probability": rain_prob,
        "humidity": humidity,
    }

    return normalized


# ------------------------
# 5 - Enviar JSON para RabbitMQ
# ------------------------
def publish_to_rabbit(payload):
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        channel.queue_declare(queue="weather_queue", durable=True)
        channel.basic_publish(
            exchange="",
            routing_key="weather_queue",
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2),
        )

        print("📤 [RabbitMQ] Mensagem enviada com sucesso!")
        connection.close()
    except Exception as e:
        print(f"❌ [RabbitMQ] ERRO ao enviar mensagem: {e}")


# ------------------------
# 6 - Job principal
# ------------------------
def job():
    print("\n[⏳] Coletando dados...")
    lat, lon, real_city_name = geocode_city(CITY)

    raw = fetch_weather(lat, lon)
    normalized = normalize_weather(real_city_name, raw)

    print("[✔] Dados normalizados:")
    print(json.dumps(normalized, indent=2, ensure_ascii=False))

    publish_to_rabbit(normalized)


# ------------------------
# 7 - Loop a cada 30 segundos
# ------------------------
if __name__ == "__main__":
    print("🚀 Processador iniciando... rodando a cada 30 segundos!")
    while True:
        job()
        print("[⏲] Aguardando 30 segundos...\n")
        time.sleep(30)
