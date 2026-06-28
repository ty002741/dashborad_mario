import { type NextRequest } from "next/server";
import { type Job104, formatJobForTelegram } from "@/lib/scraper104";
import { sendTelegramMessages } from "@/lib/telegram";

// Receives already-fetched jobs from the client and forwards them to Telegram.
// 104 fetching is done client-side to avoid Vercel IP blocks.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      jobs,
      totalCount,
      botToken,
      chatId,
      keyword,
    } = body as {
      jobs: Job104[];
      totalCount: number;
      botToken?: string;
      chatId?: string;
      keyword?: string;
    };

    const resolvedToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const resolvedChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!resolvedToken || !resolvedChatId) {
      return Response.json(
        { error: "缺少 Telegram Bot Token 或 Chat ID" },
        { status: 400 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return Response.json({ error: "沒有職缺資料可傳送" }, { status: 400 });
    }

    const config = { botToken: resolvedToken, chatId: resolvedChatId };

    const header =
      `📋 <b>104 上市上櫃職缺搜尋結果</b>\n` +
      `🔍 關鍵字：${keyword || "（全部）"}\n` +
      `📊 共 ${totalCount} 筆職缺，傳送 ${jobs.length} 筆\n` +
      `⏰ ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`;

    const jobMessages = jobs.map((job, i) =>
      formatJobForTelegram(job, i + 1)
    );

    await sendTelegramMessages(config, [header, ...jobMessages]);

    return Response.json({ success: true, sent: jobs.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[job-scraper]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
