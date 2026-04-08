"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import {
  createManagedUser,
  deleteManagedUser,
  updateManagedUser,
} from "@/lib/admin-users";

function getErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Hay datos invalidos en el formulario.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      error_description?: unknown;
    };

    const parts = [
      typeof maybeError.message === "string" ? maybeError.message.trim() : "",
      typeof maybeError.details === "string" ? maybeError.details.trim() : "",
      typeof maybeError.hint === "string" ? `Hint: ${maybeError.hint.trim()}` : "",
      typeof maybeError.error_description === "string"
        ? maybeError.error_description.trim()
        : "",
      typeof maybeError.code === "string" ? `Code: ${maybeError.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }
  try {
    return JSON.stringify(error);
  } catch {
    // noop
  }
  return "Ha ocurrido un error inesperado.";
}

function redirectWithMessage(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ status, message });
  redirect(`/admin/users?${params.toString()}`);
}

export async function createUserAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await createManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", dictionary.admin.success.create);
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await updateManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", dictionary.admin.success.update);
}

export async function deleteUserAction(formData: FormData) {
  const actor = await requireAdmin();
  const dictionary = getDictionary(getLocale());

  try {
    await deleteManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", dictionary.admin.success.delete);
}
