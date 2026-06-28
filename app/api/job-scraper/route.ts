import { type NextRequest } from "next/server";
import { scrape104Jobs, formatJobForTelegram } from "@/lib/scraper104";
import { sendTelegramMessages } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      keyword = "",
      area = "",
      jobcat = "",
      pages = 1,
      listedOnly = true,
      sendToTelegram = false,
      botToken,
      chatId,
    } = body as {
      keyword?: string;
      area?: string;
      jobcat?: string;
      pages?: number;
      listedOnly?: boolean;
      sendToTelegram?: boolean;
      botToken?: string;
      chatId?: string;
    };

    const resolvedToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const resolvedChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (sendToTelegram && (!resolvedToken || !resolvedChatId)) {
      return Response.json(
        { error: "缺少 Telegram Bot Token 或 Chat ID" },
        { status: 400 }
      );
    }

    const allJobs = [];
    let totalCount = 0;
    let totalPage = 0;

    for (let page = 1; page <= Math.min(pages, 5); page++) {
      const result = await scrape104Jobs({ keyword, area, jobcat, page, listedOnly });
      allJobs.push(...result.jobs);
      totalCount = result.totalCount;
      totalPage = result.totalPage;
    }

    if (sendToTelegram && resolvedToken && resolvedChatId) {
      const config = { botToken: resolvedToken, chatId: resolvedChatId };

      const header =
        `📋 <b>104 上市上櫃職缺搜尋結果</b>\n` +
        `🔍 關鍵字：${keyword || "（全部）"}\n` +
        `📊 共 ${totalCount} 筆職缺，顯示 ${allJobs.length} 筆\n` +
        `⏰ ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`;

      const jobMessages = allJobs.map((job, i) =>
        formatJobForTelegram(job, i + 1)
      );

      await sendTelegramMessages(config, [header, ...jobMessages]);
    }

    return Response.json({
      success: true,
      totalCount,
      totalPage,
      fetched: allJobs.length,
      jobs: allJobs,
      sentToTelegram: sendToTelegram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[job-scraper]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
