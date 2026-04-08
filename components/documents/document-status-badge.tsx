import { Badge } from "@/components/ui/badge";
import { getDocumentStatusLabels } from "@/lib/i18n-shared";
import type { DocumentStatus, Locale } from "@/lib/types";

const styles: Record<DocumentStatus, string> = {
  in_review: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  updating: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  published: "bg-blue-500/20 text-blue-300 border-blue-500/50",
};

export function DocumentStatusBadge({
  status,
  locale,
}: {
  status: DocumentStatus;
  locale: Locale;
}) {
  const labels = getDocumentStatusLabels(locale);
  return <Badge className={styles[status]}>{labels[status]}</Badge>;
}
