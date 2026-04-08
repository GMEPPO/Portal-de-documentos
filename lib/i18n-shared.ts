import type { Locale, UserRole } from "@/lib/types";

export const LOCALE_COOKIE_NAME = "docflow-locale";
export const DEFAULT_LOCALE: Locale = "pt-PT";
export const SUPPORTED_LOCALES: Locale[] = ["pt-PT", "es"];

function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && SUPPORTED_LOCALES.includes(value as Locale));
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getLocaleOptions() {
  return [
    { value: "pt-PT" as const, label: "Português" },
    { value: "es" as const, label: "Español" },
  ];
}

export function getDocumentStatusLabels(locale: Locale) {
  return locale === "es"
    ? {
        in_review: "En revisión",
        updating: "Actualizando",
        published: "Publicado",
      }
    : {
        in_review: "Em revisão",
        updating: "Em atualização",
        published: "Publicado",
      };
}

export function getDocumentProcessingStatusLabels(locale: Locale) {
  return locale === "es"
    ? {
        pending: "Pendiente",
        processing: "Procesando",
        ready: "Listo",
        failed: "Falló",
        skipped: "No aplicable",
      }
    : {
        pending: "Pendente",
        processing: "A processar",
        ready: "Pronto",
        failed: "Falhou",
        skipped: "Não aplicável",
      };
}

export function getDocumentFileTypeLabel(type: "document" | "video" | "audio", locale: Locale) {
  if (locale === "es") {
    switch (type) {
      case "document":
        return "Documento";
      case "video":
        return "Vídeo";
      case "audio":
        return "Audio";
    }
  }

  switch (type) {
    case "document":
      return "Documento";
    case "video":
      return "Vídeo";
    case "audio":
      return "Áudio";
  }
}

export function getRoleLabel(role: UserRole, locale: Locale) {
  if (locale === "es") {
    switch (role) {
      case "viewer":
        return "Visualizador";
      case "editor":
        return "Editor";
      case "manager":
        return "Gestor";
      case "admin":
        return "Administrador";
    }
  }

  switch (role) {
    case "viewer":
      return "Visualizador";
    case "editor":
      return "Editor";
    case "manager":
      return "Gestor";
    case "admin":
      return "Administrador";
  }
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
