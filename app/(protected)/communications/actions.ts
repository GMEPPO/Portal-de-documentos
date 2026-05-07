"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/auth";
import { canManageCommunications, canManageEvents } from "@/lib/rbac";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import {
  createCommunication,
  markCommunicationStatus,
  getCommunication,
} from "@/lib/communications";
import { triggerCommunicationWebhooks } from "@/lib/communications-webhook";
import { signCommunicationAttachment } from "@/lib/communications-storage";
import { getDocumentById } from "@/lib/documents-service";
import { getDocumentFileSignedUrl } from "@/lib/storage-service";
import { createEvent, updateEvent, deleteEvent } from "@/lib/events";
import type { EventInput } from "@/lib/validations";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
  if (error instanceof Error) return error.message;
  return "Erro inesperado.";
}

function redirectWithMessage(path: string, status: "success" | "error", message: string) {
  const params = new URLSearchParams({ status, message });
  redirect(`${path}?${params.toString()}`);
}

export async function sendCommunicationAction(formData: FormData) {
  const actor = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  if (!canManageCommunications(actor.role)) redirect("/unauthorized");

  const documentId = formData.get("documentId") as string;
  const subject = (formData.get("subject") as string ?? "").trim();
  const message = (formData.get("message") as string ?? "").trim();

  let commId: string | null = null;
  try {
    const created = await createCommunication(
      { documentId, subject, message, attachments: [] },
      actor,
    );
    commId = created.id;

    const detail = await getCommunication(commId);
    if (!detail) throw new Error("Comunicação não encontrada após criação.");

    const doc = await getDocumentById(documentId).catch(() => null);
    let docSignedUrl: string | null = null;
    try {
      const versions = detail.communication;
      if (doc) {
        docSignedUrl = null;
      }
    } catch { /* noop */ }

    const attachmentUrls = await Promise.all(
      detail.attachments.map(async (a) => ({
        file_name: a.fileName,
        mime_type: a.mimeType ?? null,
        size_bytes: a.sizeBytes ?? null,
        url: (await signCommunicationAttachment(a.storagePath, 86400).catch(() => null)) ?? "",
      })),
    );

    await triggerCommunicationWebhooks({
      communication_id: commId,
      document: {
        id: documentId,
        title: doc?.title ?? documentId,
        version_number: doc?.currentVersion ?? 0,
        url: docSignedUrl,
      },
      subject,
      message,
      sent_by: { id: actor.id, name: actor.name, email: actor.email },
      recipients: detail.recipients.map((r) => ({
        user_id: r.userId ?? null,
        email: r.email,
        name: r.name ?? null,
        department: r.department ?? null,
      })),
      attachments: attachmentUrls,
      tags: detail.communication.tagsSnapshot,
      departments: detail.communication.departmentsSnapshot,
      sent_at: detail.communication.sentAt,
    });

    await markCommunicationStatus(commId, "sent");
  } catch (error) {
    if (commId) {
      await markCommunicationStatus(commId, "failed", getErrorMessage(error)).catch(() => {});
    }
    redirectWithMessage(`/documents/${documentId}/comunicar`, "error", getErrorMessage(error));
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/communications");
  redirectWithMessage(
    `/communications?tab=comunicacoes`,
    "success",
    dictionary.communications.sendSuccess,
  );
}

export async function createEventAction(formData: FormData) {
  const actor = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  if (!canManageEvents(actor.role)) redirect("/unauthorized");

  const documentId = (formData.get("documentId") as string | null) ?? undefined;

  const input: EventInput = {
    subject: (formData.get("subject") as string ?? "").trim(),
    description: (formData.get("description") as string | null) ?? undefined,
    kind: (formData.get("kind") as string ?? "meeting") as EventInput["kind"],
    startsAt: formData.get("startsAt") as string,
    endsAt: (formData.get("endsAt") as string | null) || undefined,
    location: (formData.get("location") as string | null) || undefined,
    isOnline: formData.get("isOnline") === "true",
    onlineUrl: (formData.get("onlineUrl") as string | null) || undefined,
    documentIds: documentId ? [documentId] : [],
    minutesDocumentIds: [],
    attendeeIds: [],
  };

  try {
    await createEvent(input, actor);
  } catch (error) {
    redirectWithMessage("/communications/eventos/new", "error", getErrorMessage(error));
  }

  revalidatePath("/communications");
  if (documentId) revalidatePath(`/documents/${documentId}`);
  redirectWithMessage("/communications?tab=eventos", "success", dictionary.events.createSuccess);
}

export async function updateEventAction(formData: FormData) {
  const actor = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  if (!canManageEvents(actor.role)) redirect("/unauthorized");

  const eventId = formData.get("eventId") as string;

  const input: EventInput = {
    subject: (formData.get("subject") as string ?? "").trim(),
    description: (formData.get("description") as string | null) ?? undefined,
    kind: (formData.get("kind") as string ?? "meeting") as EventInput["kind"],
    startsAt: formData.get("startsAt") as string,
    endsAt: (formData.get("endsAt") as string | null) || undefined,
    location: (formData.get("location") as string | null) || undefined,
    isOnline: formData.get("isOnline") === "true",
    onlineUrl: (formData.get("onlineUrl") as string | null) || undefined,
    documentIds: [],
    minutesDocumentIds: [],
    attendeeIds: [],
  };

  try {
    await updateEvent(eventId, input);
  } catch (error) {
    redirectWithMessage(`/communications/eventos/${eventId}/edit`, "error", getErrorMessage(error));
  }

  revalidatePath("/communications");
  revalidatePath(`/communications/eventos/${eventId}`);
  redirectWithMessage(
    `/communications/eventos/${eventId}`,
    "success",
    dictionary.events.updateSuccess,
  );
}

export async function deleteEventAction(formData: FormData) {
  const actor = await requireAuth();
  const locale = getLocale();
  const dictionary = getDictionary(locale);

  if (!canManageEvents(actor.role)) redirect("/unauthorized");

  const eventId = formData.get("eventId") as string;

  try {
    await deleteEvent(eventId);
  } catch (error) {
    redirectWithMessage("/communications?tab=eventos", "error", getErrorMessage(error));
  }

  revalidatePath("/communications");
  redirectWithMessage("/communications?tab=eventos", "success", dictionary.events.deleteSuccess);
}
