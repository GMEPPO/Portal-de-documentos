import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminRoleOptions, listManagedUsers } from "@/lib/admin-users";
import { listDocumentTags } from "@/lib/admin-tags";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { departmentOptions } from "@/lib/constants";
import { createUserAction, deleteUserAction, updateUserAction } from "./users/actions";
import { createTagAction, deleteTagAction, updateTagAction } from "./tags/actions";

function formatDate(value: string | null) {
  const locale = getLocale();
  const dictionary = getDictionary(locale);
  if (!value) return dictionary.admin.never;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function messageStyles(status?: string) {
  if (status === "error") return "border-red-500/40 bg-red-500/10 text-red-100";
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { tab?: string; status?: string; message?: string };
}) {
  const currentUser = await requireAdmin();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  const activeTab = searchParams?.tab === "tags" ? "tags" : "users";

  let users: Awaited<ReturnType<typeof listManagedUsers>> = [];
  let tags: Awaited<ReturnType<typeof listDocumentTags>> = [];
  let loadError: string | null = null;

  try {
    if (activeTab === "users") {
      users = await listManagedUsers();
    } else {
      tags = await listDocumentTags();
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : activeTab === "users"
          ? dictionary.admin.loadError
          : dictionary.adminTags.loadError;
  }

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 p-1">
        <Link
          href="/admin"
          className={`rounded px-4 py-1.5 text-sm transition-colors ${
            activeTab === "users"
              ? "bg-slate-700 text-white"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {dictionary.admin.tabUsers ?? "Utilizadores"}
        </Link>
        <Link
          href="/admin?tab=tags"
          className={`rounded px-4 py-1.5 text-sm transition-colors ${
            activeTab === "tags"
              ? "bg-slate-700 text-white"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {dictionary.admin.tabTags ?? "Tags"}
        </Link>
      </div>

      {/* Feedback message */}
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

      {/* Users tab */}
      {activeTab === "users" && (
        <>
          {/* ── Criar utilizador ── */}
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.admin.createTitle}</CardTitle>
              <CardDescription>{dictionary.admin.createDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createUserAction} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
                <label className="space-y-1.5">
                  <span className="text-xs text-slate-400">{dictionary.admin.labels.name}</span>
                  <Input name="name" placeholder={dictionary.admin.placeholders.name} required disabled={Boolean(loadError)} className="h-9" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-slate-400">{dictionary.admin.labels.email}</span>
                  <Input name="email" type="email" placeholder={dictionary.admin.placeholders.email} required disabled={Boolean(loadError)} className="h-9" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-slate-400">{dictionary.admin.labels.password}</span>
                  <Input name="password" type="password" minLength={8} required disabled={Boolean(loadError)} className="h-9" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-slate-400">{dictionary.admin.labels.department}</span>
                  <select
                    name="department"
                    required
                    disabled={Boolean(loadError)}
                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="">{dictionary.admin.placeholders.department}</option>
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-slate-400">{dictionary.admin.labels.role}</span>
                  <select
                    name="role"
                    required
                    defaultValue="viewer"
                    disabled={Boolean(loadError)}
                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {adminRoleOptions.map((role) => (
                      <option key={role} value={role}>{role.toUpperCase()}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end sm:col-span-2 xl:col-span-1">
                  <AdminFormSubmitButton
                    label={dictionary.admin.create}
                    pendingLabel={dictionary.admin.creating}
                    disabled={Boolean(loadError)}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Lista de utilizadores ── */}
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.admin.listTitle}</CardTitle>
              <CardDescription>{dictionary.admin.listDescription}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!loadError && users.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">{dictionary.admin.empty}</p>
              ) : null}

              {users.length > 0 && (
                <div className="overflow-x-auto">
                  {/* Cabeçalho */}
                  <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
                    <span className="w-8 shrink-0" />
                    <span className="w-44 shrink-0">{dictionary.admin.labels.name}</span>
                    <span className="w-36 shrink-0">{dictionary.admin.labels.department}</span>
                    <span className="w-24 shrink-0">{dictionary.admin.labels.role}</span>
                    <span className="flex-1">Estado</span>
                    <span className="w-40 shrink-0 text-right">Ações</span>
                  </div>

                  {users.map((user) => {
                    const isCurrentAdmin = user.id === currentUser.id;
                    const initials = (user.name || user.email).slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-2 last:border-0 hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Forma de update — flex row, ocupa tudo menos o botão eliminar */}
                        <form action={updateUserAction} className="flex flex-1 items-center gap-3 min-w-0">
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="email" value={user.email} />
                          {isCurrentAdmin && <input type="hidden" name="role" value="admin" />}

                          {/* Avatar */}
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-100">
                            {initials}
                          </div>

                          {/* Nome (editável) + Email (só leitura) */}
                          <div className="w-44 shrink-0 min-w-0">
                            <Input
                              name="name"
                              defaultValue={user.name}
                              required
                              className="h-7 border-transparent bg-transparent px-1 text-sm font-medium text-slate-100 hover:border-slate-600 focus:border-slate-500 focus:bg-slate-900 focus:px-2"
                              title={dictionary.admin.labels.name}
                            />
                            <p className="truncate px-1 text-xs text-slate-400 leading-tight">{user.email}</p>
                          </div>

                          {/* Departamento */}
                          <select
                            name="department"
                            defaultValue={user.department}
                            required
                            className="h-8 w-36 shrink-0 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          >
                            <option value="">—</option>
                            {departmentOptions.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>

                          {/* Papel */}
                          <select
                            name={isCurrentAdmin ? undefined : "role"}
                            defaultValue={user.role}
                            disabled={isCurrentAdmin}
                            className="h-8 w-24 shrink-0 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {adminRoleOptions.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>

                          {/* Badges de estado */}
                          <div className="flex flex-1 flex-wrap gap-1 text-xs">
                            <span className={`rounded px-1.5 py-0.5 font-mono ${user.hasAuthAccount ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
                              {user.hasAuthAccount ? "AUTH ✓" : "AUTH ✗"}
                            </span>
                            <span className={`rounded px-1.5 py-0.5 font-mono ${user.hasProfile ? "bg-emerald-900/40 text-emerald-300" : "bg-amber-900/40 text-amber-300"}`}>
                              {user.hasProfile ? "PERFIL ✓" : "PERFIL ✗"}
                            </span>
                            {isCurrentAdmin && (
                              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-amber-300">tu</span>
                            )}
                          </div>

                          {/* Guardar */}
                          <AdminFormSubmitButton
                            label={dictionary.admin.save}
                            pendingLabel={dictionary.admin.saving}
                          />
                        </form>

                        {/* Eliminar — form separado (não pode ser aninhado) */}
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <AdminFormSubmitButton
                            label={dictionary.admin.delete}
                            pendingLabel={dictionary.admin.deleting}
                            variant="outline"
                            className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            disabled={isCurrentAdmin}
                          />
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Tags tab */}
      {activeTab === "tags" && (
        <>
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
                <label className="space-y-2">
                  <span className="text-sm text-slate-300">{dictionary.adminTags.labels.department}</span>
                  <select
                    name="department"
                    disabled={Boolean(loadError)}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="">{dictionary.adminTags.placeholders.department}</option>
                    {departmentOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
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
                <div key={tag.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 space-y-3">
                  <form action={updateTagAction} className="flex flex-col gap-3 md:flex-row md:items-end">
                    <input type="hidden" name="id" value={tag.id} />
                    <label className="flex-1 space-y-1">
                      <span className="text-xs text-slate-400">{dictionary.adminTags.labels.name}</span>
                      <Input name="name" defaultValue={tag.name} required disabled={Boolean(loadError)} />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-slate-400">{dictionary.adminTags.labels.department}</span>
                      <select
                        name="department"
                        defaultValue={tag.department ?? ""}
                        disabled={Boolean(loadError)}
                        className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none"
                      >
                        <option value="">—</option>
                        {departmentOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </label>
                    <AdminFormSubmitButton
                      label={dictionary.adminTags.save}
                      pendingLabel={dictionary.adminTags.saving}
                      disabled={Boolean(loadError)}
                    />
                  </form>
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
        </>
      )}
    </div>
  );
}
