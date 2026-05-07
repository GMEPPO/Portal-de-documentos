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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateEventAction } from "../../../actions";

const EVENT_KINDS = ["meeting", "training", "presentation", "other"] as const;

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

export default async function EditEventPage({
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

  const { event: ev } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/communications/eventos/${ev.id}`}>&larr; Detalhes</Link>
        </Button>
        <h1 className="text-xl font-semibold">{dictionary.events.actions.edit}: {ev.subject}</h1>
      </div>

      {searchParams?.message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.events.actions.edit}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateEventAction} className="space-y-4">
            <input type="hidden" name="eventId" value={ev.id} />
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.subject} *</span>
              <Input name="subject" defaultValue={ev.subject} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.description}</span>
              <textarea
                name="description"
                rows={3}
                defaultValue={ev.description ?? ""}
                className="flex w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.kind}</span>
                <select
                  name="kind"
                  defaultValue={ev.kind}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none"
                >
                  {EVENT_KINDS.map((k) => (
                    <option key={k} value={k}>{dictionary.events.kind[k]}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.startsAt} *</span>
                <Input name="startsAt" type="datetime-local" defaultValue={toDatetimeLocal(ev.startsAt)} required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.endsAt}</span>
                <Input name="endsAt" type="datetime-local" defaultValue={toDatetimeLocal(ev.endsAt)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.location}</span>
                <Input name="location" defaultValue={ev.location ?? ""} />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isOnline"
                name="isOnline"
                value="true"
                defaultChecked={ev.isOnline}
                className="h-4 w-4"
              />
              <label htmlFor="isOnline" className="text-sm text-slate-300">{dictionary.events.fields.isOnline}</label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.onlineUrl}</span>
              <Input name="onlineUrl" type="url" defaultValue={ev.onlineUrl ?? ""} placeholder="https://..." />
            </label>
            <AdminFormSubmitButton
              label={dictionary.events.actions.edit}
              pendingLabel={dictionary.events.saving}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
