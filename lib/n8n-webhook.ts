type DocumentIndexingWebhookPayload = {
  document_id: string;
  file_path: string;
  source_filename: string;
  document_type: string;
  title: string;
  version_number: number;
};

export function getN8nWebhookUrls() {
  const productionUrl = process.env.N8N_WEBHOOK_URL;
  const testUrl = process.env.N8N_WEBHOOK_TEST_URL;

  const missing: string[] = [];
  if (!productionUrl) missing.push("N8N_WEBHOOK_URL");
  if (!testUrl) missing.push("N8N_WEBHOOK_TEST_URL");

  if (missing.length > 0) {
    throw new Error(`Falta configurar ${missing.join(" e ")} no ambiente.`);
  }

  return {
    productionUrl,
    testUrl,
  };
}

async function postWebhook(
  webhookUrl: string,
  payload: DocumentIndexingWebhookPayload & {
    file: Blob;
  },
) {
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

export async function triggerDocumentIndexingWebhooks(
  payload: DocumentIndexingWebhookPayload & {
    file: Blob;
  },
) {
  const { productionUrl, testUrl } = getN8nWebhookUrls();

  const [productionResult, testResult] = await Promise.allSettled([
    postWebhook(productionUrl, payload),
    postWebhook(testUrl, payload),
  ]);

  const errors: string[] = [];
  if (productionResult.status === "rejected") {
    errors.push(`producao: ${productionResult.reason instanceof Error ? productionResult.reason.message : "erro ao chamar webhook"}`);
  }
  if (testResult.status === "rejected") {
    errors.push(`teste: ${testResult.reason instanceof Error ? testResult.reason.message : "erro ao chamar webhook"}`);
  }

  if (errors.length > 0) {
    throw new Error(`Falha ao disparar webhooks n8n (${errors.join(" | ")}).`);
  }

  return {
    production: productionResult.status === "fulfilled",
    test: testResult.status === "fulfilled",
  };
}

export type { DocumentIndexingWebhookPayload };
