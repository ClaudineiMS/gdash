import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WeatherCardProps {
  title: string;
  value: string | number;
}

export default function WeatherCard({ title, value }: WeatherCardProps) {
  return (
    <Card className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-xl border-zinc-700/40 hover:scale-[1.01] transition-all duration-200">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
