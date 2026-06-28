export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export async function sendTelegramMessage(
  config: TelegramConfig,
  text: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
}

export async function sendTelegramMessages(
  config: TelegramConfig,
  messages: string[]
): Promise<void> {
  for (const msg of messages) {
    await sendTelegramMessage(config, msg);
    // Telegram rate limit: max 30 messages/second; 200ms gap is safe
    await new Promise((r) => setTimeout(r, 200));
  }
}
