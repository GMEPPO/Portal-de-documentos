import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { canManageCommunications } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getDocumentById } from "@/lib/documents-service";
import { resolveRecipientsForDocument } from "@/lib/communications";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendCommunicationAction } from "../../../communications/actions";

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function ComunicarPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { status?: string; message?: string };
}) {
  const user = await requireAuth();
  if (!canManageCommunications(user.role)) redirect("/unauthorized");

  const locale = getLocale();
  const dictionary = getDictionary(locale);

  const doc = await getDocumentById(params.id).catch(() => null);
  if (!doc) notFound();

  let resolution: Awaited<ReturnType<typeof resolveRecipientsForDocument>> = {
    recipients: [],
    tags: [],
    departments: [],
  };
  let resolveError: string | null = null;
  try {
    resolution = await resolveRecipientsForDocument(params.id);
  } catch (error) {
    resolveError = error instanceof Error ? error.message : "Erro ao resolver destinatários.";
  }

  const noRecipients = resolution.recipients.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/documents/${params.id}`}>&larr; {doc.title}</Link>
        </Button>
        <h1 className="text-xl font-semibold">{dictionary.communications.actions.send}</h1>
      </div>

      {searchParams?.message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      )}

      {resolveError && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {resolveError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.communications.actions.preview}</CardTitle>
          <CardDescription>
            {noRecipients
              ? dictionary.communications.noRecipients
              : `${resolution.recipients.length} ${dictionary.communications.fields.recipients} · ${resolution.departments.join(", ")}`}
          </CardDescription>
        </CardHeader>
        {!noRecipients && (
          <CardContent className="space-y-2">
            {resolution.recipients.map((r) => (
              <div
                key={r.userId}
                className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">{r.name} ({r.email})</span>
                <span className="text-xs text-slate-400">{r.department}</span>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {noRecipients && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {dictionary.documents.detail.noRecipients}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.communications.actions.send}</CardTitle>
          <CardDescription>{doc.title} · v{doc.currentVersion}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendCommunicationAction} className="space-y-4">
            <input type="hidden" name="documentId" value={params.id} />
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.communications.fields.subject} *</span>
              <Input name="subject" required disabled={noRecipients} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.communications.fields.message} *</span>
              <textarea
                name="message"
                rows={6}
                required
                disabled={noRecipients}
                className="flex w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
            <AdminFormSubmitButton
              label={dictionary.communications.actions.send}
              pendingLabel={dictionary.communications.sending}
              disabled={noRecipients}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
