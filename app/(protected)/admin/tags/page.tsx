import { requireAdmin } from "@/lib/auth";
import { listDocumentTags } from "@/lib/admin-tags";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { createTagAction, deleteTagAction } from "./actions";

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams?: { status?: string; message?: string };
}) {
  await requireAdmin();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  let tags: Awaited<ReturnType<typeof listDocumentTags>> = [];
  let loadError: string | null = null;
  try {
    tags = await listDocumentTags();
  } catch (error) {
    loadError = error instanceof Error ? error.message : dictionary.adminTags.loadError;
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.adminTags.createTitle}</CardTitle>
          <CardDescription>{dictionary.adminTags.createDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTagAction} className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1 space-y-2">
              <span className="text-sm text-slate-300">{dictionary.adminTags.labels.name}</span>
              <Input name="name" placeholder={dictionary.adminTags.placeholders.name} required disabled={Boolean(loadError)} />
            </label>
            <AdminFormSubmitButton
              label={dictionary.adminTags.create}
              pendingLabel={dictionary.adminTags.creating}
              disabled={Boolean(loadError)}
            />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.adminTags.listTitle}</CardTitle>
          <CardDescription>{dictionary.adminTags.listDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!loadError && tags.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
              {dictionary.adminTags.empty}
            </div>
          ) : null}

          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">{tag.name}</p>
                <p className="text-xs text-slate-400">{tag.id}</p>
              </div>
              <form action={deleteTagAction}>
                <input type="hidden" name="id" value={tag.id} />
                <AdminFormSubmitButton
                  label={dictionary.adminTags.delete}
                  pendingLabel={dictionary.adminTags.deleting}
                  variant="outline"
                  className="border-red-500/40 text-red-200 hover:bg-red-500/10"
                  disabled={Boolean(loadError)}
                />
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

