import { useEffect, useMemo, useState } from "react";
import { ResponsiveBar } from "@nivo/bar";
import { WeatherAPI } from "@/api/weather.api";

interface WeatherItem {
  timestamp_utc: string;
  wind_speed_kmh: number;
}

export interface WeatherWindChartProps {
  date: string; 
}

export default function WeatherWindChart({ date }: WeatherWindChartProps) {
  const [dayHistory, setDayHistory] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;

    async function loadDayHistory() {
      try {
        setLoading(true);
        const data = await WeatherAPI.getDay(date);
        setDayHistory(data || []);
      } catch (err) {
        console.error(err);
        setDayHistory([]);
      } finally {
        setLoading(false);
      }
    }

    loadDayHistory();
  }, [date]);
 
  const data = useMemo(() => {
    const buckets: { sum: number; count: number }[] = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));

    dayHistory.forEach((item) => {
      if (!item || item.wind_speed_kmh == null) return;
      const d = new Date(item.timestamp_utc);
      const hour = d.getHours();
      if (hour >= 0 && hour <= 23) {
        buckets[hour].sum += item.wind_speed_kmh;
        buckets[hour].count += 1;
      }
    });

    const arr = buckets.map((b, h) => {
      const label = h.toString().padStart(2, "0") + ":00";
      const avg = b.count > 0 ? Number((b.sum / b.count).toFixed(2)) : 0;
      return {
        hourLabel: label,
        wind: avg,
        count: b.count,
      };
    });

    return arr;
  }, [dayHistory]);

  if (loading) return <p className="text-zinc-400 text-center py-6">Carregando histórico do vento...</p>;
  if (!dayHistory || dayHistory.length === 0)
    return <p className="text-zinc-400 text-center py-6">Nenhum dado de vento disponível para esta data.</p>;

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <h3 className="text-lg font-bold text-white mb-4 text-center">
        Velocidade do Vento
      </h3>

      <div className="h-[340px]">
        <ResponsiveBar
          data={data}
          keys={["wind"]}
          indexBy="hourLabel"
          margin={{ top: 20, right: 20, bottom: 70, left: 70 }}
          padding={0.2}
          layout="vertical"
          colors={["#60a5fa"]}
          colorBy="indexValue"
          borderRadius={4}
          axisBottom={{
            tickRotation: -45,
            tickSize: 5,
            tickPadding: 8,
            legend: "Hora",
            legendPosition: "middle",
            legendOffset: 48,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 8,
            legend: "Velocidade do vento (km/h)",
            legendPosition: "middle",
            legendOffset: -60,
          }}
          enableGridY={true}
          enableGridX={false}
          theme={{
            text: { fill: "#d1d5db" },
            grid: { line: { stroke: "#1f2937" } },
            tooltip: { container: { background: "#0f1724", color: "#fff" } },
          }}
          tooltip={({ indexValue, value, data: barData }) => {
            // barData tem { hourLabel, wind, count }
            const count = (barData as any).count ?? 0;
            const windVal = (barData as any).wind;
            return (
              <div className="bg-zinc-900 text-white rounded p-2 shadow-lg border border-zinc-800">
                <div className="text-sm text-zinc-400">{indexValue}</div>
                {count > 0 ? (
                  <>
                    <div className="mt-1 text-lg font-semibold">{windVal} km/h</div>
                    <div className="text-sm text-zinc-300">Amostras: {count}</div>
                  </>
                ) : (
                  <div className="mt-1 text-sm text-zinc-300">Sem dados</div>
                )}
              </div>
            );
          }}
          // mostra legenda pequena no topo direito
          legends={[
            {
              dataFrom: "keys",
              anchor: "top-right",
              direction: "column",
              translateX: 50,
              itemWidth: 100,
              itemHeight: 20,
              symbolSize: 12,
            },
          ]}
          // acessibilidade: desativa animação se quiser
          animate={true}
        />
      </div>
    </div>
  );
}
