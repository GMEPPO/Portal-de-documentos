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
  payload: DocumentIndexingWebhookPayload,
) {
  const webhookUrl = getN8nWebhookUrl();
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
