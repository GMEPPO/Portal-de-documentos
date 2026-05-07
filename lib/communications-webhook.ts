type CommunicationWebhookRecipient = {
  user_id: string | null;
  email: string;
  name: string | null;
  department: string | null;
};

type CommunicationWebhookAttachment = {
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  url: string;
};

export type CommunicationWebhookPayload = {
  communication_id: string;
  document: {
    id: string;
    title: string;
    version_number: number;
    url: string | null;
  };
  subject: string;
  message: string;
  sent_by: { id: string; name: string; email: string };
  recipients: CommunicationWebhookRecipient[];
  attachments: CommunicationWebhookAttachment[];
  tags: string[];
  departments: string[];
  sent_at: string;
};

export function getCommunicationsWebhookUrls() {
  const productionUrl = process.env.N8N_COMMS_WEBHOOK_URL;
  const testUrl = process.env.N8N_COMMS_WEBHOOK_TEST_URL;

  const missing: string[] = [];
  if (!productionUrl) missing.push("N8N_COMMS_WEBHOOK_URL");
  if (!testUrl) missing.push("N8N_COMMS_WEBHOOK_TEST_URL");

  if (missing.length > 0) {
    throw new Error(`Falta configurar ${missing.join(" e ")} no ambiente.`);
  }

  return {
    productionUrl: productionUrl as string,
    testUrl: testUrl as string,
  };
}

async function postCommunicationWebhook(
  webhookUrl: string,
  payload: CommunicationWebhookPayload,
) {
  console.info("[comms-webhook] sending", {
    webhookUrl,
    communicationId: payload.communication_id,
    recipients: payload.recipients.length,
    attachments: payload.attachments.length,
  });

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  console.info("[comms-webhook] response", {
    webhookUrl,
    communicationId: payload.communication_id,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      body || `n8n respondeu com estado ${response.status} ao receber comunicação.`,
    );
  }

  return response;
}

export async function triggerCommunicationWebhooks(payload: CommunicationWebhookPayload) {
  const { productionUrl, testUrl } = getCommunicationsWebhookUrls();

  const [productionResult, testResult] = await Promise.allSettled([
    postCommunicationWebhook(productionUrl, payload),
    postCommunicationWebhook(testUrl, payload),
  ]);

  const errors: string[] = [];
  if (productionResult.status === "rejected") {
    errors.push(
      `produção: ${productionResult.reason instanceof Error ? productionResult.reason.message : "erro ao chamar webhook"}`,
    );
  }
  if (testResult.status === "rejected") {
    errors.push(
      `teste: ${testResult.reason instanceof Error ? testResult.reason.message : "erro ao chamar webhook"}`,
    );
  }

  const succeeded =
    productionResult.status === "fulfilled" || testResult.status === "fulfilled";

  if (!succeeded) {
    throw new Error(`Falha ao disparar webhook de comunicações (${errors.join(" | ")}).`);
  }

  return {
    production: productionResult.status === "fulfilled",
    test: testResult.status === "fulfilled",
    errors,
  };
}
