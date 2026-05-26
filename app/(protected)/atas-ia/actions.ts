"use server";

export type GenerateAtaResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function generateAtaAction(text: string): Promise<GenerateAtaResult> {
  const trimmed = text?.trim() ?? "";

  if (trimmed.length < 20) {
    return { ok: false, error: "O texto é demasiado curto. Cola as notas da reunião completas." };
  }

  const webhookUrl = process.env.N8N_ATAS_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      ok: false,
      error:
        "O serviço de geração de atas não está configurado (N8N_ATAS_WEBHOOK_URL em falta). Contacta o administrador.",
    };
  }

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      // Processamento IA pode demorar — timeout generoso de 5 min
      signal: AbortSignal.timeout(300_000),
    });
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.name === "TimeoutError"
          ? "O serviço demorou demasiado tempo a responder. Tenta novamente."
          : err.message
        : "Erro de ligação ao serviço de geração de atas.";
    return { ok: false, error: msg };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      ok: false,
      error: body || `O serviço devolveu um erro (estado ${response.status}).`,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, error: "A resposta do serviço não é válida." };
  }

  // Aceitar vários formatos de resposta do n8n
  const downloadUrl =
    typeof data === "string"
      ? data.trim()
      : typeof data === "object" && data !== null
        ? ((data as Record<string, unknown>).url ??
          (data as Record<string, unknown>).download_url ??
          (data as Record<string, unknown>).pdf_url ??
          (data as Record<string, unknown>).link)
        : null;

  if (!downloadUrl || typeof downloadUrl !== "string" || !downloadUrl.startsWith("http")) {
    return {
      ok: false,
      error: "O serviço não devolveu um link de download válido. Verifica o workflow n8n.",
    };
  }

  return { ok: true, url: downloadUrl };
}
