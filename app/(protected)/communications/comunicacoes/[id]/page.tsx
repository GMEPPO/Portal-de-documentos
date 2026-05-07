import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { canManageCommunications } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getCommunication } from "@/lib/communications";
import { signCommunicationAttachment } from "@/lib/communications-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function statusBadgeClass(status: string) {
  if (status === "sent") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (status === "failed") return "bg-red-500/20 text-red-300 border-red-500/40";
  return "bg-amber-500/20 text-amber-300 border-amber-500/40";
}

export default async function CommunicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireAuth();
  if (!canManageCommunications(user.role)) redirect("/unauthorized");

  const locale = getLocale();
  const dictionary = getDictionary(locale);

  const detail = await getCommunication(params.id).catch(() => null);
  if (!detail) notFound();

  const { communication: comm, recipients, attachments } = detail;

  const signedAttachments = await Promise.all(
    attachments.map(async (a) => ({
      ...a,
      signedUrl: await signCommunicationAttachment(a.storagePath, 3600).catch(() => null),
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/communications">&larr; {dictionary.communications.tabs.comms}</Link>
        </Button>
        <h1 className="text-xl font-semibold truncate">{comm.subject}</h1>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(comm.n8nStatus)}`}
        >
          {dictionary.communications.status[comm.n8nStatus]}
        </span>
      </div>

      {comm.n8nError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {comm.n8nError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.communications.fields.message}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{comm.message}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
              <p>
                <span className="text-slate-500">{dictionary.communications.fields.sentAt}:</span>{" "}
                {new Date(comm.sentAt).toLocaleString(locale)}
              </p>
              <p>
                <span className="text-slate-500">{dictionary.communications.fields.recipients}:</span>{" "}
                {comm.recipientCount}
              </p>
              {comm.tagsSnapshot.length > 0 && (
                <p className="col-span-2">
                  <span className="text-slate-500">Tags:</span>{" "}
                  {comm.tagsSnapshot.join(", ")}
                </p>
              )}
              {comm.departmentsSnapshot.length > 0 && (
                <p className="col-span-2">
                  <span className="text-slate-500">Departamentos:</span>{" "}
                  {comm.departmentsSnapshot.join(", ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.communications.fields.recipients}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recipients.length === 0 && (
                <p className="text-sm text-slate-400">{dictionary.communications.empty}</p>
              )}
              {recipients.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm">
                  <span className="text-slate-200">{r.name ?? r.email}</span>
                  <span className="text-xs text-slate-400">{r.department}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {signedAttachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.communications.fields.attachments}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {signedAttachments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm">
                    <span className="truncate text-slate-200">{a.fileName}</span>
                    {a.signedUrl && (
                      <a
                        href={a.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 shrink-0 text-xs text-amber-400 hover:underline"
                      >
                        Abrir
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
