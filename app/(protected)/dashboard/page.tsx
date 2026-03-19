import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listDocuments } from "@/lib/documents-service";

export default function DashboardPage() {
  const docs = listDocuments();
  const pending = docs.filter((doc) => doc.status === "in_review").length;
  const published = docs.filter((doc) => doc.status === "published").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard documental</h1>
        <p className="text-slate-400">Visao operacional de volumes, estados e seguimento.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total documentos</CardDescription>
            <CardTitle>{docs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Em revisao</CardDescription>
            <CardTitle>{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Publicados</CardDescription>
            <CardTitle>{published}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Indicadores base</CardTitle>
          <CardDescription>
            Este modulo esta preparado para ligar consultas analiticas reais ao Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Taxa de aprovacao, lead time de revisao e backlog por departamento.
        </CardContent>
      </Card>
    </div>
  );
}
