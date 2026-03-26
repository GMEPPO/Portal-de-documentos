import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  const user = await requireAuth();
  const doc = await getDocumentById(params.id);
  if (!doc) notFound();
  if (!canEditDocument(user.role)) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edicao de documento</CardTitle>
        <CardDescription>
          Esta pagina esta preparada para formulario completo de atualizacao de metadados.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        Documento selecionado: <span className="text-slate-100">{doc.title}</span>
      </CardContent>
    </Card>
  );
}
