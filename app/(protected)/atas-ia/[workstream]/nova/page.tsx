import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  VALID_WORKSTREAMS,
  WORKSTREAM_LABELS,
  type WorkstreamId,
} from "@/lib/workstream-atas";
import { NovaAtaClient } from "./nova-ata-client";

export default async function NovaAtaPage({
  params,
}: {
  params: { workstream: string };
}) {
  if (!VALID_WORKSTREAMS.includes(params.workstream as WorkstreamId)) notFound();
  const workstream = params.workstream as WorkstreamId;

  await requireAuth();

  return (
    <NovaAtaClient
      workstream={workstream}
      workstreamLabel={WORKSTREAM_LABELS[workstream]}
    />
  );
}
