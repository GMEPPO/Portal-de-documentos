import { mockUsers } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilizadores e permissoes</CardTitle>
        <CardDescription>Gestao de perfis RBAC e atribuicoes por area.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <THead>
            <tr>
              <TH>Nome</TH>
              <TH>Email</TH>
              <TH>Perfil</TH>
              <TH>Departamento</TH>
            </tr>
          </THead>
          <TBody>
            {mockUsers.map((user) => (
              <tr key={user.id}>
                <TD>{user.name}</TD>
                <TD>{user.email}</TD>
                <TD className="uppercase text-amber-300">{user.role}</TD>
                <TD>{user.department}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
