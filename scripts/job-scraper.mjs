#!/usr/bin/env node
/**
 * 104 上市上櫃職缺爬蟲 → Telegram
 *
 * 使用方式：
 *   node scripts/job-scraper.mjs
 *
 * 環境變數設定（建立 .env.local 或直接 export）：
 *   TELEGRAM_BOT_TOKEN=你的BotToken
 *   TELEGRAM_CHAT_ID=你的ChatID
 *
 * 搜尋條件可在下方 CONFIG 修改。
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 讀取 .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  try {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {
    // .env.local not found, rely on process.env
  }
}
loadEnv();

// ─── 搜尋設定（按需修改）─────────────────────────────────────────────────────
const CONFIG = {
  keyword: process.argv[2] ?? "",        // 關鍵字，可從命令列傳入：node job-scraper.mjs 工程師
  area: process.argv[3] ?? "",           // 地區代碼（留空=全台，台北=6001001000）
  listedOnly: true,                       // true = 只抓上市上櫃
  pages: 1,                              // 抓幾頁（每頁約 20 筆）
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
};

// ─── 104 爬蟲 ─────────────────────────────────────────────────────────────────
async function scrape104(page = 1) {
  const params = new URLSearchParams({
    ro: "0",
    kwop: "7",
    keyword: CONFIG.keyword,
    order: "14",
    asc: "0",
    s5: CONFIG.listedOnly ? "1" : "0",
    mode: "s",
    jobsource: "2018indexpoc",
    page: String(page),
  });
  if (CONFIG.area) params.set("area", CONFIG.area);

  const url = `https://www.104.com.tw/jobs/search/list?${params}`;
  const res = await fetch(url, {
    headers: {
      Referer: "https://www.104.com.tw/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-TW,zh;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`104 API 錯誤：${res.status} ${res.statusText}`);
  return res.json();
}

function parseJobs(json) {
  return (json?.data?.list ?? []).map((item) => ({
    jobName: item.jobName ?? "",
    custName: item.custName ?? "",
    jobAddrNoDesc: item.jobAddrNoDesc ?? "",
    salaryDesc: item.salaryDesc ?? "",
    periodDesc: item.periodDesc ?? "",
    tags: item.tags ?? [],
    link: item.link?.job
      ? `https://www.104.com.tw${item.link.job}`
      : "https://www.104.com.tw",
  }));
}

// ─── Telegram 傳訊 ────────────────────────────────────────────────────────────
function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatJob(job, index) {
  const tags = job.tags.length ? `🏷 ${job.tags.join(" · ")}\n` : "";
  return (
    `${index}. <b>${esc(job.jobName)}</b>\n` +
    `🏢 ${esc(job.custName)}\n` +
    `📍 ${esc(job.jobAddrNoDesc)}\n` +
    `💰 ${esc(job.salaryDesc)}\n` +
    `${tags}` +
    `🔗 <a href="${job.link}">查看職缺</a>\n` +
    `🕐 ${esc(job.periodDesc)}`
  );
}

async function sendTelegram(text) {
  const url = `https://api.telegram.org/bot${CONFIG.telegramToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CONFIG.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram 錯誤 ${res.status}: ${body}`);
  }
}

// ─── 主程式 ───────────────────────────────────────────────────────────────────
async function main() {
  if (!CONFIG.telegramToken || !CONFIG.telegramChatId) {
    console.error("❌ 缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID");
    console.error("   請在 .env.local 檔案中設定，或執行前 export");
    process.exit(1);
  }

  console.log(`🔍 搜尋關鍵字：「${CONFIG.keyword || "（全部）"}」`);
  console.log(`📊 上市上櫃：${CONFIG.listedOnly ? "是" : "否"}，爬取頁數：${CONFIG.pages}`);

  const allJobs = [];
  let totalCount = 0;

  for (let p = 1; p <= CONFIG.pages; p++) {
    process.stdout.write(`   抓取第 ${p} 頁...`);
    const json = await scrape104(p);
    const jobs = parseJobs(json);
    allJobs.push(...jobs);
    totalCount = json?.data?.totalCount ?? 0;
    console.log(` ✓ ${jobs.length} 筆`);
  }

  console.log(`\n✅ 共 ${totalCount} 筆職缺，本次取得 ${allJobs.length} 筆`);
  console.log("📨 開始傳送到 Telegram...\n");

  // 傳標題
  const header =
    `📋 <b>104 上市上櫃職缺搜尋結果</b>\n` +
    `🔍 關鍵字：${esc(CONFIG.keyword) || "（全部）"}\n` +
    `📊 共 ${totalCount} 筆，本次傳送 ${allJobs.length} 筆\n` +
    `⏰ ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`;
  await sendTelegram(header);

  // 逐筆傳送
  for (let i = 0; i < allJobs.length; i++) {
    await sendTelegram(formatJob(allJobs[i], i + 1));
    process.stdout.write(`\r   傳送進度：${i + 1}/${allJobs.length}`);
    await new Promise((r) => setTimeout(r, 250)); // Telegram rate limit
  }

  console.log(`\n\n🎉 完成！已將 ${allJobs.length} 筆職缺傳送到 Telegram`);
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
