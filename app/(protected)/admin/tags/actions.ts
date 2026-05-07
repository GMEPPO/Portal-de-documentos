"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { createDocumentTag, deleteDocumentTag, updateDocumentTag } from "@/lib/admin-tags";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Há dados inválidos no formulário.";
  }
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error); } catch { /* noop */ }
  return "Erro inesperado.";
}

function redirectWithMessage(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ tab: "tags", status, message });
  redirect(`/admin?${params.toString()}`);
}

export async function createTagAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await createDocumentTag(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin");
  redirectWithMessage("success", dictionary.adminTags.success.create);
}

export async function updateTagAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await updateDocumentTag(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin");
  redirectWithMessage("success", dictionary.adminTags.success.update ?? dictionary.adminTags.success.create);
}

export async function deleteTagAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await deleteDocumentTag(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin");
  redirectWithMessage("success", dictionary.adminTags.success.delete);
}

