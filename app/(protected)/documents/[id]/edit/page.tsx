import { notFound } from "next/navigation";
import { DocumentHeaderForm } from "@/components/documents/document-header-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDocumentById } from "@/lib/documents-service";
import { canEditDocument } from "@/lib/rbac";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function loadAvailableTags() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("document_tags").select("name").order("name", { ascending: true });
  if (error) return [];
  return (data ?? []).map((r: any) => r.name as string).filter(Boolean);
}

export default async function EditDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  let doc = null;
  try {
    doc = await getDocumentById(params.id);
  } catch {
    doc = null;
  }
  if (!doc) notFound();
  if (!canEditDocument(user.role)) notFound();

  const availableTags = await loadAvailableTags();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar documento</CardTitle>
        <CardDescription>Edita o nome, resumo e tags do documento. Para gerir ficheiros e versões, usa os controlos na página do documento.</CardDescription>
      </CardHeader>
      <CardContent>
        <DocumentHeaderForm
          documentId={doc.id}
          initialValues={{
            title: doc.title,
            summary: doc.summary,
            tags: doc.tags ?? [],
          }}
          availableTags={availableTags}
        />
      </CardContent>
    </Card>
  );
}
