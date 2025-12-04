import { useEffect, useState } from "react";
import { WeatherAPI } from "@/api/weather.api";

import WeatherCard from "@/components/weather/WeatherCard";


export default function Dashboard() {
  const [weather, setWeather] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);


  useEffect(() => {
    async function load() {
      try {
        const w = await WeatherAPI.latest();
        const h = await WeatherAPI.history();

        setWeather(w);
        setHistory(h);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }

    load();
  }, []);
  console.log(weather)
  if (!weather) return <p className="text-center p-4">Carregando...</p>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeatherCard
          title="Cidade"
          value={`${weather.city}`}
        />

        <WeatherCard
          title="Temperatura"
          value={`${weather.temperature_c}°C`}
        />

        <WeatherCard
          title="Condição"
          value={weather.condition_text}
        />

        <WeatherCard
          title="Vento"
          value={`${weather.wind_speed_kmh} km/h`}
        />
      </div>
  
    </div>
  );
}
