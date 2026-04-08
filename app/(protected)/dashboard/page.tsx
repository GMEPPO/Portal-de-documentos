import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { listDocuments } from "@/lib/documents-service";
import { canAccessDocumentStatus } from "@/lib/rbac";

export default async function DashboardPage() {
  const user = await requireAuth();
  const dictionary = getDictionary(getLocale());
  const docs = (await listDocuments()).filter((doc) =>
    canAccessDocumentStatus(user.role, doc.status),
  );
  const pending = docs.filter((doc) => doc.status === "in_review").length;
  const published = docs.filter((doc) => doc.status === "published").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dictionary.dashboard.title}</h1>
        <p className="text-slate-400">{dictionary.dashboard.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{dictionary.dashboard.totalDocuments}</CardDescription>
            <CardTitle>{docs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{dictionary.dashboard.inReview}</CardDescription>
            <CardTitle>{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{dictionary.dashboard.published}</CardDescription>
            <CardTitle>{published}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.indicatorsTitle}</CardTitle>
          <CardDescription>{dictionary.dashboard.indicatorsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          {dictionary.dashboard.indicatorsBody}
        </CardContent>
      </Card>
    </div>
  );
}
