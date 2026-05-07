import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { canManageEvents } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createEventAction } from "../../actions";

const EVENT_KINDS = ["meeting", "training", "presentation", "other"] as const;

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams?: { status?: string; message?: string; documentId?: string };
}) {
  const user = await requireAuth();
  if (!canManageEvents(user.role)) redirect("/unauthorized");

  const locale = getLocale();
  const dictionary = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/communications?tab=eventos">&larr; {dictionary.events.title}</Link>
        </Button>
        <h1 className="text-xl font-semibold">{dictionary.events.actions.create}</h1>
      </div>

      {searchParams?.message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.events.actions.create}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEventAction} className="space-y-4">
            {searchParams?.documentId && (
              <input type="hidden" name="documentId" value={searchParams.documentId} />
            )}
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.subject} *</span>
              <Input name="subject" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.description}</span>
              <textarea
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.kind}</span>
                <select
                  name="kind"
                  defaultValue="meeting"
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none"
                >
                  {EVENT_KINDS.map((k) => (
                    <option key={k} value={k}>{dictionary.events.kind[k]}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.startsAt} *</span>
                <Input name="startsAt" type="datetime-local" required />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.endsAt}</span>
                <Input name="endsAt" type="datetime-local" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-slate-300">{dictionary.events.fields.location}</span>
                <Input name="location" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isOnline" name="isOnline" value="true" className="h-4 w-4" />
              <label htmlFor="isOnline" className="text-sm text-slate-300">{dictionary.events.fields.isOnline}</label>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">{dictionary.events.fields.onlineUrl}</span>
              <Input name="onlineUrl" type="url" placeholder="https://..." />
            </label>
            <AdminFormSubmitButton
              label={dictionary.events.actions.create}
              pendingLabel={dictionary.events.creating}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
