import { Badge } from "@/components/ui/badge";
import { documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

const styles: Record<DocumentStatus, string> = {
  draft: "bg-slate-700 text-slate-200",
  in_review: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  published: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  archived: "bg-slate-700/70 text-slate-400",
  rejected: "bg-red-600/20 text-red-300 border-red-600/50",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge className={styles[status]}>{documentStatusLabels[status]}</Badge>;
}
