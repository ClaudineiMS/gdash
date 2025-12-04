import { useEffect, useState } from "react";
import { WeatherAPI } from "@/api/weather.api";

import WeatherCard from "@/components/weather/WeatherCard";
import WeatherChart from "@/components/weather/WeatherChart";
import WeatherTable from "@/components/weather/WeatherTable";

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

  if (!weather) return <p className="text-center p-4 text-zinc-400">Carregando...</p>;

  return (
    <div className="p-8 space-y-10 bg-zinc-950 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Dashboard Climático
        </h1>
        <p className="text-zinc-400">
          Monitoramento em tempo real • Última atualização:{" "}
          {new Date(weather.timestamp_utc).toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <WeatherCard title="Cidade" value={weather.city} />
        <WeatherCard title="Temperatura" value={`${weather.temperature_c}°C`} />
        <WeatherCard title="Condição" value={weather.condition_text} />
        <WeatherCard title="Vento" value={`${weather.wind_speed_kmh} km/h`} />
      </div>
      <WeatherChart data={history} />
      <WeatherTable data={history} />
    </div>
  );
}
