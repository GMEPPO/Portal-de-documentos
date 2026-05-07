import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { canManageCommunications } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { listCommunications } from "@/lib/communications";
import { listEvents } from "@/lib/events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

function statusBadgeClass(status: string) {
  if (status === "sent") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  if (status === "failed") return "bg-red-500/20 text-red-300 border-red-500/40";
  return "bg-amber-500/20 text-amber-300 border-amber-500/40";
}

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams?: { tab?: string; status?: string; message?: string };
}) {
  const user = await requireAuth();
  if (!canManageCommunications(user.role)) redirect("/unauthorized");

  const locale = getLocale();
  const dictionary = getDictionary(locale);
  const activeTab = searchParams?.tab === "eventos" ? "eventos" : "comunicacoes";

  let communications: Awaited<ReturnType<typeof listCommunications>> = [];
  let events: Awaited<ReturnType<typeof listEvents>> = [];
  let loadError: string | null = null;

  try {
    if (activeTab === "comunicacoes") {
      communications = await listCommunications({ limit: 50 });
    } else {
      events = await listEvents();
    }
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar dados.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dictionary.communications.title}</h1>
        {activeTab === "eventos" && (
          <Button asChild>
            <Link href="/communications/eventos/new">{dictionary.events.actions.create}</Link>
          </Button>
        )}
      </div>

      <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-1">
        <Link
          href="/communications"
          className={`rounded px-4 py-1.5 text-sm transition-colors ${
            activeTab === "comunicacoes" ? "bg-slate-700 text-white" : "text-slate-300 hover:text-white"
          }`}
        >
          {dictionary.communications.tabs.comms}
        </Link>
        <Link
          href="/communications?tab=eventos"
          className={`rounded px-4 py-1.5 text-sm transition-colors ${
            activeTab === "eventos" ? "bg-slate-700 text-white" : "text-slate-300 hover:text-white"
          }`}
        >
          {dictionary.communications.tabs.events}
        </Link>
      </div>

      {searchParams?.message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {loadError}
        </div>
      ) : null}

      {activeTab === "comunicacoes" && (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.communications.tabs.comms}</CardTitle>
            <CardDescription>{dictionary.communications.fields.sentAt}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {communications.length === 0 ? (
              <p className="text-sm text-slate-400">{dictionary.communications.empty}</p>
            ) : null}
            {communications.map((comm) => (
              <Link
                key={comm.id}
                href={`/communications/comunicacoes/${comm.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-3 hover:bg-slate-800/60 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-slate-100">{comm.subject}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(comm.sentAt).toLocaleString(locale)} · {comm.recipientCount} {dictionary.communications.fields.recipients}
                  </p>
                </div>
                <span
                  className={`ml-3 shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(comm.n8nStatus)}`}
                >
                  {dictionary.communications.status[comm.n8nStatus]}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "eventos" && (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.events.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">{dictionary.events.empty}</p>
            ) : null}
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-slate-100">{ev.subject}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(ev.startsAt).toLocaleString(locale)} · {dictionary.events.kind[ev.kind]}
                  </p>
                </div>
                <div className="ml-3 flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/communications/eventos/${ev.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
