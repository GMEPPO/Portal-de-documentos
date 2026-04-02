type DocumentIndexingWebhookPayload = {
  document_id: string;
  file_path: string;
  source_filename: string;
  document_type: string;
  title: string;
  version_number: number;
};

export function getN8nWebhookUrl() {
  const isProduction =
    process.env.VERCEL_ENV === "production" ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

  const url = isProduction
    ? process.env.N8N_WEBHOOK_URL
    : process.env.N8N_WEBHOOK_TEST_URL;

  if (!url) {
    throw new Error(
      isProduction
        ? "Falta configurar N8N_WEBHOOK_URL no ambiente de producao."
        : "Falta configurar N8N_WEBHOOK_TEST_URL no ambiente de teste.",
    );
  }

  return url;
}

export async function triggerDocumentIndexingWebhook(
  payload: DocumentIndexingWebhookPayload & {
    file: Blob;
  },
) {
  const webhookUrl = getN8nWebhookUrl();
  const formData = new FormData();
  formData.append("document_id", payload.document_id);
  formData.append("file_path", payload.file_path);
  formData.append("source_filename", payload.source_filename);
  formData.append("document_type", payload.document_type);
  formData.append("title", payload.title);
  formData.append("version_number", String(payload.version_number));
  formData.append("file", payload.file, payload.source_filename);

  const response = await fetch(webhookUrl, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      body || `n8n respondeu com estado ${response.status} ao receber o webhook.`,
    );
  }

  return response;
}

export type { DocumentIndexingWebhookPayload };
