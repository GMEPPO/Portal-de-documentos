import { requireAdmin } from "@/lib/auth";
import { adminRoleOptions, listManagedUsers } from "@/lib/admin-users";
import { AdminFormSubmitButton } from "@/components/admin/admin-form-submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createUserAction, deleteUserAction, updateUserAction } from "./actions";

function formatDate(value: string | null) {
  if (!value) return "Nunca";

  return new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function messageStyles(status?: string) {
  if (status === "error") {
    return "border-red-500/40 bg-red-500/10 text-red-100";
  }

  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-100";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    message?: string;
  };
}) {
  const currentUser = await requireAdmin();
  const users = await listManagedUsers();

  return (
    <div className="space-y-6">
      {searchParams?.message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${messageStyles(searchParams.status)}`}>
          {searchParams.message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
          <CardDescription>
            Alta directa en Supabase Auth y asignacion inicial de rol y departamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Nombre</span>
              <Input name="name" placeholder="Nombre completo" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Email</span>
              <Input name="email" type="email" placeholder="usuario@empresa.com" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Contrasena temporal</span>
              <Input name="password" type="password" minLength={8} required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Departamento</span>
              <Input name="department" placeholder="Departamento" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Rol</span>
              <select
                name="role"
                required
                defaultValue="viewer"
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {adminRoleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <div className="md:col-span-2 xl:col-span-5">
              <AdminFormSubmitButton
                label="Crear usuario"
                pendingLabel="Creando usuario..."
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores e permissoes</CardTitle>
          <CardDescription>
            Solo los administradores pueden acceder aqui, cambiar roles y eliminar usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user) => {
            const isCurrentAdmin = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className="rounded-lg border border-slate-700 bg-slate-900/50 p-4"
              >
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{user.email || user.name}</p>
                    <p className="text-sm text-slate-400">
                      Creado: {formatDate(user.createdAt)} · Ultimo acceso: {formatDate(user.lastSignInAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      {user.hasAuthAccount ? "Auth OK" : "Sin Auth"}
                    </span>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                      {user.hasProfile ? "Perfil OK" : "Perfil pendiente"}
                    </span>
                    {isCurrentAdmin ? (
                      <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-300">
                        Tu cuenta
                      </span>
                    ) : null}
                  </div>
                </div>

                <form action={updateUserAction} className="grid gap-4 lg:grid-cols-4">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="email" value={user.email} />
                  {isCurrentAdmin ? (
                    <input type="hidden" name="role" value="admin" />
                  ) : null}
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Nombre</span>
                    <Input name="name" defaultValue={user.name} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Email</span>
                    <Input value={user.email} disabled readOnly />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Departamento</span>
                    <Input name="department" defaultValue={user.department} required />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-300">Rol</span>
                    <select
                      name={isCurrentAdmin ? undefined : "role"}
                      defaultValue={user.role}
                      disabled={isCurrentAdmin}
                      className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adminRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="lg:col-span-4 flex flex-wrap items-center gap-3">
                    <AdminFormSubmitButton
                      label="Guardar cambios"
                      pendingLabel="Guardando..."
                    />
                    <span className="text-sm text-slate-400">
                      ID: {user.id}
                    </span>
                  </div>
                </form>

                <form action={deleteUserAction} className="mt-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <AdminFormSubmitButton
                    label="Eliminar usuario"
                    pendingLabel="Eliminando..."
                    variant="outline"
                    className="border-red-500/40 text-red-200 hover:bg-red-500/10"
                    disabled={isCurrentAdmin}
                  />
                </form>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
