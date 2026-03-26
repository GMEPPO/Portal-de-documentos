import { Badge } from "@/components/ui/badge";
import { documentStatusLabels } from "@/lib/rbac";
import type { DocumentStatus } from "@/lib/types";

const styles: Record<DocumentStatus, string> = {
  in_review: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  published: "bg-blue-500/20 text-blue-300 border-blue-500/50",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge className={styles[status]}>{documentStatusLabels[status]}</Badge>;
}
