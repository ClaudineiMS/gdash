import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeatherChartProps {
  data: any[];
}

export default function WeatherChart({ data }: WeatherChartProps) {
  // Formatar datas para exibir no gráfico
  const formatted = data.map((item) => ({
    ...item,
    time: new Date(item.timestamp_utc).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <div className="w-full h-80 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 shadow">
      <h2 className="text-lg font-semibold mb-3 text-white">
        Temperatura ao longo do tempo
      </h2>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,20,0.8)",
              border: "1px solid #333",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#eee" }}
            itemStyle={{ color: "#eee" }}
          />
          <Line
            type="monotone"
            dataKey="temperature_c"
            stroke="#4ea8de"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
