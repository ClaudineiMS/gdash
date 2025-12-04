import { ResponsiveLine } from "@nivo/line";

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

  // converter dados para formato do Nivo
  const chartData = [
    {
      id: "Temperatura (°C)",
      color: "hsl(217, 91%, 60%)", // azul tailwind #3b82f6
      data: [...history].reverse().map((item) => ({
        x: new Date(item.createdAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        y: item.temperature_c,
      })),
    },
  ];

  return (
    <div className="bg-zinc-900 p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">
        Histórico de Temperatura
      </h2>

      <div className="h-[300px]">
        <ResponsiveLine
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 50, left: 50 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
            stacked: false,
          }}
          axisBottom={{
            tickRotation: -30,
            tickSize: 5,
            tickPadding: 5,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
          }}
          colors={(d) => d.color}
          lineWidth={3}
          pointSize={6}
          pointColor="#3b82f6"
          pointBorderWidth={2}
          pointBorderColor="#fff"
          useMesh={true}
          theme={{
            text: {
              fill: "#fff"
            }
          }}
        />
      </div>
    </div>
  );
}
