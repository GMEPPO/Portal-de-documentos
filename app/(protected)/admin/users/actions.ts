"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
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
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
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

  try {
    await createManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", "Usuario creado correctamente.");
}

export async function updateUserAction(formData: FormData) {
  const actor = await requireAdmin();

  try {
    await updateManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", "Usuario actualizado correctamente.");
}

export async function deleteUserAction(formData: FormData) {
  const actor = await requireAdmin();

  try {
    await deleteManagedUser(actor, formData);
  } catch (error) {
    redirectWithMessage("error", getErrorMessage(error));
  }

  revalidatePath("/admin/users");
  redirectWithMessage("success", "Usuario eliminado correctamente.");
}
