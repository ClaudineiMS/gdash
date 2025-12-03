import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  title: string;
  value: string | number;
}

export default function WeatherCard({ title, value }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
