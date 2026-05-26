import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  getAta,
  VALID_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type WorkstreamId,
} from "@/lib/workstream-atas";
import { getLocale } from "@/lib/i18n";
import { AtaDetailClient } from "./ata-detail-client";

export default async function AtaDetailPage({
  params,
  searchParams,
}: {
  params: { workstream: string; id: string };
  searchParams?: { saved?: string };
}) {
  if (!VALID_WORKSTREAMS.includes(params.workstream as WorkstreamId)) notFound();
  const workstream = params.workstream as WorkstreamId;

  await requireAuth();
  const locale = getLocale();

  const ata = await getAta(params.id).catch(() => null);
  if (!ata || ata.workstream !== workstream) notFound();

  return (
    <AtaDetailClient
      ata={ata}
      workstreamLabel={WORKSTREAM_LABELS[workstream]}
      locale={locale}
      initialSuccess={searchParams?.saved === "1"}
    />
  );
}
