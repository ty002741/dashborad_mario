#!/usr/bin/env node
/**
 * 104 上市上櫃職缺爬蟲 → Telegram
 *
 * ✅ 在你自己的電腦跑：home IP 不會被 Cloudflare 封鎖
 *
 * 使用方式：
 *   node scripts/job-scraper.mjs                    # 搜尋全部
 *   node scripts/job-scraper.mjs 工程師             # 搜尋工程師
 *   node scripts/job-scraper.mjs 會計 6001001000    # 台北市的會計
 *
 * 地區代碼：
 *   6001001000 台北市 | 6001002000 新北市 | 6001003000 桃園市
 *   6001005000 台中市 | 6001007000 台南市 | 6001008000 高雄市
 *
 * 需要 Node.js 18+（支援原生 fetch），不需要 npm install
 * Telegram 憑證請放在 .env.local 或設環境變數
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 讀取 .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const lines = readFileSync(resolve(__dirname, "..", name), "utf-8").split("\n");
      for (const line of lines) {
        const [key, ...rest] = line.split("=");
        const k = key?.trim();
        if (k && !k.startsWith("#") && rest.length) {
          process.env[k] = rest.join("=").trim();
        }
      }
      break;
    } catch { /* file not found, try next */ }
  }
}
loadEnv();

// ─── 設定 ────────────────────────────────────────────────────────────────────
const KEYWORD     = process.argv[2] ?? "";
const AREA        = process.argv[3] ?? "";
const PAGES       = Number(process.argv[4] ?? 1);
const LISTED_ONLY = true; // true = 只抓上市上櫃

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID   ?? "";

// ─── 驗證設定 ─────────────────────────────────────────────────────────────────
if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ 缺少 Telegram 設定");
  console.error("   請在專案根目錄建立 .env.local，內容如下：");
  console.error("   TELEGRAM_BOT_TOKEN=你的BotToken");
  console.error("   TELEGRAM_CHAT_ID=你的ChatID");
  process.exit(1);
}

// ─── 104 爬蟲 ─────────────────────────────────────────────────────────────────
async function fetch104Page(page) {
  const params = new URLSearchParams({
    ro: "0", kwop: "7", keyword: KEYWORD,
    order: "14", asc: "0",
    s5: LISTED_ONLY ? "1" : "0",
    mode: "s", jobsource: "2018indexpoc",
    page: String(page),
  });
  if (AREA) params.set("area", AREA);

  const url = `https://www.104.com.tw/jobs/search/list?${params}`;
  const res = await fetch(url, {
    headers: {
      Referer: "https://www.104.com.tw/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) throw new Error(`104 API 錯誤：${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Telegram 傳訊 ────────────────────────────────────────────────────────────
function esc(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatJob(job, index) {
  const tags  = job.tags?.length ? `🏷 ${job.tags.join(" · ")}\n` : "";
  const link  = job.link?.job ? `https://www.104.com.tw${job.link.job}` : "https://www.104.com.tw";
  return (
    `${index}. <b>${esc(job.jobName)}</b>\n` +
    `🏢 ${esc(job.custName)}\n` +
    `📍 ${esc(job.jobAddrNoDesc)}\n` +
    `💰 ${esc(job.salaryDesc)}\n` +
    `${tags}` +
    `🔗 <a href="${link}">查看職缺</a>\n` +
    `🕐 ${esc(job.periodDesc)}`
  );
}

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram 錯誤：${JSON.stringify(data)}`);
}

// ─── 主程式 ───────────────────────────────────────────────────────────────────
async function main() {
  const label = KEYWORD ? `「${KEYWORD}」` : "（全部）";
  const area  = AREA    ? ` 地區：${AREA}` : "";
  console.log(`\n🔍 搜尋 104 上市上櫃職缺 ${label}${area}`);
  console.log(`   頁數：${PAGES} 頁（每頁約 20 筆）\n`);

  const allJobs = [];
  let totalCount = 0;

  for (let p = 1; p <= Math.min(PAGES, 5); p++) {
    process.stdout.write(`   第 ${p} 頁...`);
    const json = await fetch104Page(p);
    const list = json?.data?.list ?? [];
    allJobs.push(...list);
    totalCount = json?.data?.totalCount ?? 0;
    console.log(` ✓ ${list.length} 筆`);
  }

  console.log(`\n✅ 共 ${totalCount} 筆職缺，本次取得 ${allJobs.length} 筆`);

  if (allJobs.length === 0) {
    console.log("   沒有符合條件的職缺");
    return;
  }

  console.log("\n📨 傳送到 Telegram...");

  const header =
    `📋 <b>104 上市上櫃職缺搜尋結果</b>\n` +
    `🔍 關鍵字：${esc(KEYWORD) || "（全部）"}\n` +
    `📊 共 ${totalCount} 筆職缺，本次傳送 ${allJobs.length} 筆\n` +
    `⏰ ${new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}`;

  await sendTelegram(header);

  for (let i = 0; i < allJobs.length; i++) {
    await sendTelegram(formatJob(allJobs[i], i + 1));
    process.stdout.write(`\r   ${i + 1}/${allJobs.length} 筆已傳送`);
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`\n\n🎉 完成！已將 ${allJobs.length} 筆上市上櫃職缺傳送到 Telegram\n`);
}

main().catch((err) => {
  console.error("\n❌ 錯誤：", err.message);
  process.exit(1);
});
