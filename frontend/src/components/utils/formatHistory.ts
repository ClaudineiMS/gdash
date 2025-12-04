export function formatHistory(history: any[]) {
  if (!Array.isArray(history)) return { temps: [], wind: [], labels: [] };

  const labels = history.map((h) =>
    new Date(h.timestamp_utc).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const temps = history.map((h) => h.temperature_c);
  const wind = history.map((h) => h.wind_speed_kmh);
  const rainProb = history.map((h) => h.rain_probability ?? 0);
  const humidity = history.map((h) => h.humidity ?? 0);

  return {
    labels,
    temps,
    wind,
    rainProb,
    humidity,
  };
}
