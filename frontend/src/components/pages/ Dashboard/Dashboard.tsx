import { useEffect, useState } from "react";
import { WeatherAPI } from "@/api/weather.api";
import WeatherCard from "@/components/weather/WeatherCard";
import WeatherTable from "@/components/weather/WeatherTable";
import WeatherCharts from "@/components/weather/WeatherChart";

export default function Dashboard() {
  const [weather, setWeather] = useState<any>(null);

  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });

  useEffect(() => {
    async function load() {
      try {
        const w = await WeatherAPI.latest();
        setWeather(w);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await WeatherAPI.history(page, 10);

        setHistory(response.items);
        setPagination({
          page: response.page,
          totalPages: response.totalPages,
          total: response.total,
          limit: response.limit,
        });
      } catch (err) {
        console.error(err);
      }
    }
    loadHistory();
  }, [page]);

  if (!weather) return <p className="p-4 text-center text-zinc-400">Carregando...</p>;
  console.log(history)
  return (
    <div className="p-8 space-y-10 bg-zinc-950 min-h-screen">

      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">Dashboard Climático</h1>
         <p className="text-zinc-400">
          Monitoramento em tempo real • Última atualização:{" "}
          {new Date(weather.timestamp_utc).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <WeatherCard title="Cidade" value={weather.city} />
        <WeatherCard title="Temperatura" value={`${weather.temperature_c}°C`} />
        <WeatherCard title="Condição" value={weather.condition_text} />
        <WeatherCard title="Vento" value={`${weather.wind_speed_kmh} km/h`} />
      </div>

      {/* GRÁFICOS */}
      <WeatherCharts history={history} />

      {/* TABELA PAGINADA */}
      <div className="space-y-4">
        <WeatherTable data={history} />

        <div className="flex items-center justify-between text-white">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-40"
          >
            ⬅ Anterior
          </button>

          <span className="text-zinc-300">
            Página {pagination.page} de {pagination.totalPages}
          </span>

          <button
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            className="px-4 py-2 bg-zinc-800 rounded disabled:opacity-40"
          >
            Próxima ➡
          </button>
        </div>
      </div>
    </div>
  );
}
