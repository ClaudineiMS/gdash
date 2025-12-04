import { formatDate } from "@/components/utils/formatDate";

interface Props {
  data: any[];
}

export default function WeatherTable({ data }: Props) {
  return (
    <div className="rounded-xl overflow-hidden shadow-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      
      <table className="w-full text-left text-sm text-zinc-300">
        
        <thead className="bg-zinc-800/60 text-zinc-400 uppercase text-xs tracking-wider">
          <tr>
            <th className="p-3">Data/Hora</th>
            <th className="p-3">Cidade</th>
            <th className="p-3">Condição</th>
            <th className="p-3">Temp.</th>
            <th className="p-3">Vento</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              className="border-t border-zinc-700/40 hover:bg-zinc-800/40 transition-colors"
            >
              <td className="p-3 text-white">
                {formatDate(item.timestamp_utc)}
              </td>

              <td className="p-3">{item.city}</td>
              <td className="p-3">{item.condition_text}</td>
              <td className="p-3 font-medium text-white">
                {item.temperature_c}°C
              </td>
              <td className="p-3">{item.wind_speed_kmh} km/h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}