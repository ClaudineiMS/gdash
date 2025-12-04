import { useEffect, useMemo, useState } from "react";
import { ResponsiveLine } from "@nivo/line";
import { WeatherAPI } from "@/api/weather.api";

interface WeatherItem {
  timestamp_utc: string;
  temperature_c: number;
  wind_speed_kmh: number;
  condition_text?: string;
}

export interface WeatherDayChartProps {
  date?: string; // data selecionada
  onDateChange?: (date: string) => void; // callback para avisar o pai
}

export default function WeatherDayChart({ date, onDateChange }: WeatherDayChartProps) {
  console.log(date)
  const [dayHistory, setDayHistory] = useState<WeatherItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    date || new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadDayHistory() {
      try {
        setLoading(true);
        const data = await WeatherAPI.getDay(selectedDate);
        setDayHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDayHistory();
  }, [selectedDate]);

  const handleDateChange = (d: string) => {
    setSelectedDate(d);
    if (onDateChange) onDateChange(d);
  };

  function aggregateByHour(history: WeatherItem[]) {
    if (!history || history.length === 0) return [];

    const buckets: Record<number, { temps: number[]; winds: number[]; conditions: string[]; hourLabel: string }> = {};

    history.forEach((item) => {
      const d = new Date(item.timestamp_utc);
      const hour = d.getHours();
      const label = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).slice(0, 5);

      if (!buckets[hour]) buckets[hour] = { temps: [], winds: [], conditions: [], hourLabel: label };
      buckets[hour].temps.push(item.temperature_c);
      buckets[hour].winds.push(item.wind_speed_kmh);
      if (item.condition_text) buckets[hour].conditions.push(item.condition_text);
      buckets[hour].hourLabel = label;
    });

    return Object.keys(buckets)
      .map((k) => {
        const b = buckets[Number(k)];
        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / Math.max(arr.length, 1);
        const freq = b.conditions.reduce<Record<string, number>>((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {});
        const most = Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b), "");
        return {
          hour: Number(k),
          label: b.hourLabel,
          temperature: Number(avg(b.temps).toFixed(2)),
          wind: Number(avg(b.winds).toFixed(2)),
          condition: most || "",
        };
      })
      .sort((a, b) => a.hour - b.hour);
  }

  const series = useMemo(() => {
    const agg = aggregateByHour(dayHistory);
    if (agg.length === 0) return { tempSeries: [], condByHour: [] };

    const temps = agg.map((a) => a.temperature);
    const winds = agg.map((a) => a.wind);

    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);
    const windMin = Math.min(...winds);
    const windMax = Math.max(...winds);

    const scaleWindToTemp = (w: number) => {
      if (windMax === windMin) return tempMin;
      const normalized = (w - windMin) / (windMax - windMin);
      return tempMin + normalized * (tempMax - tempMin);
    };

    const tempSeries = {
      id: "Temperatura (°C)",
      color: "#3b82f6",
      data: agg.map((a) => ({ x: a.label, y: a.temperature, meta: a })),
    };

    const windSeries = {
      id: "Vento (km/h) - escala visual",
      color: "#60a5fa",
      data: agg.map((a) => ({ x: a.label, y: scaleWindToTemp(a.wind), meta: a })),
    };

    const condByHour = agg.map((a) => ({ x: a.label, condition: a.condition }));

    return { tempSeries: [tempSeries, windSeries], condByHour };
  }, [dayHistory]);

  if (loading) return <p className="text-zinc-400 text-center py-6">Carregando dados do dia...</p>;
  if (!dayHistory || dayHistory.length === 0)
    return <p className="text-zinc-400 text-center py-6">Nenhum dado disponível para esta data.</p>;

  const data = series.tempSeries || [];

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Clima por Hora - {selectedDate}</h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="bg-zinc-800 text-white px-2 py-1 rounded border border-zinc-700"
        />
      </div>

      <div className="h-[360px]">
        <ResponsiveLine
          data={data}
          margin={{ top: 20, right: 50, bottom: 70, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          curve="monotoneX"
          enableArea={true}
          areaOpacity={0.08}
          enablePoints={true}
          pointSize={6}
          axisBottom={{ tickRotation: -45, tickPadding: 8 }}
          axisLeft={{ tickPadding: 8, legend: "Temperatura (escala visual)", legendOffset: -50 }}
          theme={{ text: { fill: "#d1d5db" }, grid: { line: { stroke: "#1f2937" } } }}
          tooltip={({ point }) => {
            const meta = point.data.meta as { temperature: number; wind: number; condition: string } | undefined;
            return (
              <div className="bg-zinc-900 text-white rounded p-2 shadow-lg border border-zinc-800">
                <div className="text-sm text-zinc-400">{point.data.x}</div>
                <div className="mt-1 text-lg font-semibold">{meta?.temperature ?? point.data.y}°C</div>
                <div className="text-sm text-zinc-300">Vento: {meta?.wind ?? "—"} km/h</div>
                {meta?.condition && <div className="text-sm text-zinc-300">Condição: {meta.condition}</div>}
              </div>
            );
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(series.condByHour || []).map((c) => (
          <div key={c.x} className="px-2 py-1 text-xs rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700">
            <strong className="mr-1">{c.x}</strong>
            <span className="opacity-80">{c.condition || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
