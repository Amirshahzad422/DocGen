import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConnectivityCard({
  title,
  value,
  note,
}: {
  title: string;
  value: string | number | null | undefined;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value ?? "—"}</CardTitle>
        <p className="text-xs text-muted-foreground">{note}</p>
      </CardHeader>
    </Card>
  );
}