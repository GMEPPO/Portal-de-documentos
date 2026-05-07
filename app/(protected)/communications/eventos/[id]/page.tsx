import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { canManageEvents } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getEvent } from "@/lib/events";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteEventAction } from "../../actions";

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { status?: string; message?: string };
}) {
  const user = await requireAuth();
  if (!canManageEvents(user.role)) redirect("/unauthorized");

  const locale = getLocale();
  const dictionary = getDictionary(locale);

  const detail = await getEvent(params.id).catch(() => null);
  if (!detail) notFound();

  const { event: ev, documents: docLinks, attendees } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/communications?tab=eventos">&larr; {dictionary.events.title}</Link>
        </Button>
        <h1 className="text-xl font-semibold">{ev.subject}</h1>
        <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs">
          {dictionary.events.kind[ev.kind]}
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href={`/communications/eventos/${ev.id}/edit`}>{dictionary.events.actions.edit}</Link>
        </Button>
      </div>

      {searchParams?.message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">{dictionary.events.fields.startsAt}:</span>{" "}
              <span className="text-slate-200">{new Date(ev.startsAt).toLocaleString(locale)}</span>
            </p>
            {ev.endsAt && (
              <p>
                <span className="text-slate-500">{dictionary.events.fields.endsAt}:</span>{" "}
                <span className="text-slate-200">{new Date(ev.endsAt).toLocaleString(locale)}</span>
              </p>
            )}
            {ev.location && (
              <p>
                <span className="text-slate-500">{dictionary.events.fields.location}:</span>{" "}
                <span className="text-slate-200">{ev.location}</span>
              </p>
            )}
            {ev.isOnline && ev.onlineUrl && (
              <p>
                <span className="text-slate-500">{dictionary.events.fields.onlineUrl}:</span>{" "}
                <a
                  href={ev.onlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  {ev.onlineUrl}
                </a>
              </p>
            )}
            {ev.description && (
              <p className="pt-2 text-slate-300 whitespace-pre-wrap">{ev.description}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {docLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.events.fields.documents}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {docLinks.map((d) => (
                  <div key={`${d.documentId}-${d.role}`} className="flex items-center justify-between rounded border border-slate-700 px-3 py-2 text-sm">
                    <Link href={`/documents/${d.documentId}`} className="text-amber-400 hover:underline truncate">
                      {d.documentId}
                    </Link>
                    <span className="ml-2 shrink-0 text-xs text-slate-400">{d.role}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {attendees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.events.fields.attendees}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {attendees.map((a) => (
                  <div key={a.userId} className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-200">
                    {a.userId}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <form action={deleteEventAction}>
        <input type="hidden" name="eventId" value={ev.id} />
        <AdminFormSubmitButton
          label={dictionary.events.actions.delete}
          pendingLabel={dictionary.events.deleting}
          variant="outline"
          className="border-red-500/40 text-red-200 hover:bg-red-500/10"
        />
      </form>
    </div>
  );
}
