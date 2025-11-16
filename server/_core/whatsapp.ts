import { ENV } from "./env";
import type { WhatsAppSettings } from "../../drizzle/schema";

type SendWhatsAppParams = {
  to: string;
  body: string;
  credentials?: Pick<WhatsAppSettings, "token" | "phoneId" | "apiUrl">;
};

function normalizeNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function sendWhatsAppText({ to, body, credentials }: SendWhatsAppParams) {
  const token = credentials?.token || ENV.whatsappToken;
  const phoneId = credentials?.phoneId || ENV.whatsappPhoneId;
  const apiUrl = credentials?.apiUrl || ENV.whatsappApiUrl || "https://graph.facebook.com/v18.0";

  if (!token || !phoneId) {
    console.warn("[WhatsApp] Missing token or phone ID; skipping send.");
    return;
  }

  const normalized = normalizeNumber(to);

  const url = `${apiUrl.replace(/\/+$/, "")}/${phoneId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: normalized,
    type: "text",
    text: { body },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[WhatsApp] Send failed", res.status, errText);
    throw new Error(`WhatsApp send failed: ${res.statusText}`);
  }
}
