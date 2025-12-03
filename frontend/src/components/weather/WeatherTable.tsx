interface Props {
  data: any[];
}

export default function WeatherTable({ data }: Props) {
  return (
    <div className="rounded-lg border p-4 overflow-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="p-2">Data</th>
            <th className="p-2">Temperatura</th>
            <th className="p-2">Umidade</th>
            <th className="p-2">Vento</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{item.time}</td>
              <td className="p-2">{item.temperature}°C</td>
              <td className="p-2">{item.humidity}%</td>
              <td className="p-2">{item.windspeed} km/h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
