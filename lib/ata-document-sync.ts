/**
 * Sincroniza uma ata com o sistema de documentos:
 *  - Gera o PDF da ata
 *  - Faz upload para o bucket `documents`
 *  - Cria (ou adiciona versão a) um documento na tabela `documents`
 *  - Atualiza `workstream_atas.document_id`
 */

import { randomUUID } from "crypto";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServiceServerClient } from "@/lib/supabase-service-server";
import { AtaPdf } from "@/lib/ata-pdf";
import { WORKSTREAM_LABELS, type WorkstreamAtaRecord } from "@/lib/workstream-atas";
import type { AppUser } from "@/lib/types";

// ID da categoria "Atas de Reunião" no sistema de documentos
const ATA_CATEGORY_ID = "33333333-3333-3333-3333-333333333333";

function formatDatePT(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function generatePdfUint8(ata: WorkstreamAtaRecord): Promise<Uint8Array> {
  const buffer = await renderToBuffer(React.createElement(AtaPdf, { ata }) as any);
  return new Uint8Array(buffer);
}

/**
 * Cria um novo documento no sistema de documentos a partir de uma ata.
 * Chamado quando a ata é guardada pela primeira vez.
 * Devolve o `document_id` criado, ou null se falhar (não bloqueia o fluxo).
 */
export async function syncAtaToDocument(
  ata: WorkstreamAtaRecord,
  actor: AppUser,
): Promise<string | null> {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) return null;

  try {
    const wsLabel = WORKSTREAM_LABELS[ata.workstream] ?? ata.workstream.toUpperCase();
    const datePT = formatDatePT(ata.meetingDate);
    const title = `${wsLabel} — ${datePT}`;
    const fileName = `ata-${ata.workstream}-${ata.meetingDate}.pdf`;
    const storagePath = `atas/${ata.id}/${fileName}`;

    // 1. Gerar PDF
    const pdfBytes = await generatePdfUint8(ata);

    // 2. Upload para o bucket "documents"
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new Error(`Storage upload: ${uploadErr.message}`);

    // 3. Criar registo de documento
    const now = new Date().toISOString();
    const docId = randomUUID();

    const { error: docErr } = await supabase.from("documents").insert({
      id: docId,
      title,
      summary: `Ata de reunião — ${wsLabel} — ${datePT}.`,
      category_id: ATA_CATEGORY_ID,
      department: wsLabel,
      status: "published",
      current_version: 0,
      author_id: actor.id,
      owner_id: actor.id,
      preview_file_path: null,
      preview_status: "skipped",
      search_status: "skipped",
      preview_error: null,
      search_error: null,
      tags: [],
      created_at: now,
      updated_at: now,
    });

    if (docErr) {
      // Tentativa de fallback sem colunas de processamento opcionais
      const { error: docErr2 } = await supabase.from("documents").insert({
        id: docId,
        title,
        summary: `Ata de reunião — ${wsLabel} — ${datePT}.`,
        category_id: ATA_CATEGORY_ID,
        department: wsLabel,
        status: "published",
        current_version: 0,
        author_id: actor.id,
        owner_id: actor.id,
        preview_file_path: null,
        tags: [],
        created_at: now,
        updated_at: now,
      });
      if (docErr2) throw new Error(`Insert documento: ${docErr2.message}`);
    }

    // 4. Criar versão 1
    const versionId = randomUUID();
    const { error: verErr } = await supabase.from("document_versions").insert({
      id: versionId,
      document_id: docId,
      version_number: 1,
      changelog: `Ata gerada automaticamente — ${wsLabel} ${datePT}`,
      created_by: actor.id,
      created_at: now,
    });
    if (verErr) throw new Error(`Insert versão: ${verErr.message}`);

    // 5. Criar registo de ficheiro da versão
    const { error: fileErr } = await supabase.from("document_version_files").insert({
      id: randomUUID(),
      version_id: versionId,
      file_type: "document",
      file_path: storagePath,
      original_name: fileName,
      sort_order: 0,
      created_at: now,
    });
    if (fileErr) throw new Error(`Insert version file: ${fileErr.message}`);

    // 6. Actualizar current_version para 1
    await supabase
      .from("documents")
      .update({ current_version: 1, updated_at: now })
      .eq("id", docId);

    // 7. Guardar document_id na ata
    await supabase
      .from("workstream_atas")
      .update({ document_id: docId })
      .eq("id", ata.id);

    return docId;
  } catch (err) {
    console.error("[ata-document-sync] Erro ao sincronizar ata com documento:", err);
    return null;
  }
}

/**
 * Adiciona uma nova versão ao documento existente quando a ata é editada.
 * Chamado após `updateAta`.
 */
export async function addAtaDocumentVersion(
  ata: WorkstreamAtaRecord,
  documentId: string,
  actor: AppUser,
): Promise<void> {
  const supabase = createSupabaseServiceServerClient();
  if (!supabase) return;

  try {
    const wsLabel = WORKSTREAM_LABELS[ata.workstream] ?? ata.workstream.toUpperCase();
    const datePT = formatDatePT(ata.meetingDate);

    // Versão seguinte
    const { data: current } = await supabase
      .from("documents")
      .select("current_version")
      .eq("id", documentId)
      .maybeSingle();
    const nextVersion = (current?.current_version ?? 0) + 1;

    // Gerar PDF
    const pdfBytes = await generatePdfUint8(ata);

    // Upload
    const fileName = `ata-${ata.workstream}-${ata.meetingDate}-v${nextVersion}.pdf`;
    const storagePath = `atas/${ata.id}/${fileName}`;
    await supabase.storage
      .from("documents")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    const now = new Date().toISOString();
    const versionId = randomUUID();

    // Nova versão
    const { error: verErr } = await supabase.from("document_versions").insert({
      id: versionId,
      document_id: documentId,
      version_number: nextVersion,
      changelog: `Ata atualizada — ${wsLabel} ${datePT}`,
      created_by: actor.id,
      created_at: now,
    });
    if (verErr) throw new Error(`Insert versão: ${verErr.message}`);

    // Ficheiro da versão
    await supabase.from("document_version_files").insert({
      id: randomUUID(),
      version_id: versionId,
      file_type: "document",
      file_path: storagePath,
      original_name: fileName,
      sort_order: 0,
      created_at: now,
    });

    // Actualizar current_version e updated_at
    await supabase
      .from("documents")
      .update({ current_version: nextVersion, updated_at: now })
      .eq("id", documentId);
  } catch (err) {
    console.error("[ata-document-sync] Erro ao adicionar versão de documento:", err);
  }
}
