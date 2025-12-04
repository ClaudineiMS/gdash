import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface WeatherChartProps {
  history: any[];
}

export default function WeatherCharts({ history = [] }: WeatherChartProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-zinc-400 text-center py-6">
        Nenhum dado histórico disponível.
      </p>
    );
  }

  const data = [...history]
    .reverse()
    .map(item => ({
      ...item,
      created_at: new Date(item.createdAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Histórico de Temperatura</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="created_at" stroke="#888" />
          <YAxis stroke="#888" />
          <Tooltip />
          <Line type="monotone" dataKey="temperature_c" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
