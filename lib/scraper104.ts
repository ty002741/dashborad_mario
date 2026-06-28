export interface Job104 {
  jobName: string;
  custName: string;
  jobAddrNoDesc: string;
  salaryDesc: string;
  periodDesc: string;
  tags: string[];
  link: string;
}

interface Raw104Job {
  jobName?: string;
  custName?: string;
  jobAddrNoDesc?: string;
  salaryDesc?: string;
  periodDesc?: string;
  tags?: string[];
  link?: { job?: string };
}

interface Raw104Response {
  data?: {
    list?: Raw104Job[];
    totalPage?: number;
    totalCount?: number;
  };
}

export interface ScraperOptions {
  keyword?: string;
  area?: string;
  jobcat?: string;
  page?: number;
  listedOnly?: boolean; // 上市上櫃
}

export async function scrape104Jobs(options: ScraperOptions = {}): Promise<{
  jobs: Job104[];
  totalCount: number;
  totalPage: number;
}> {
  const {
    keyword = "",
    area = "",
    jobcat = "",
    page = 1,
    listedOnly = true,
  } = options;

  const params = new URLSearchParams({
    ro: "0",
    kwop: "7",
    keyword,
    order: "14",
    asc: "0",
    s5: listedOnly ? "1" : "0", // 1 = 上市上櫃 only
    mode: "s",
    jobsource: "2018indexpoc",
    page: String(page),
  });

  if (area) params.set("area", area);
  if (jobcat) params.set("jobcat", jobcat);

  const url = `https://www.104.com.tw/jobs/search/list?${params}`;

  const res = await fetch(url, {
    headers: {
      Referer: "https://www.104.com.tw/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`104 API error: ${res.status} ${res.statusText}`);
  }

  const json: Raw104Response = await res.json();
  const list: Raw104Job[] = json?.data?.list ?? [];

  const jobs: Job104[] = list.map((item) => ({
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

  return {
    jobs,
    totalCount: json?.data?.totalCount ?? 0,
    totalPage: json?.data?.totalPage ?? 0,
  };
}

export function formatJobForTelegram(job: Job104, index: number): string {
  const tags = job.tags.length > 0 ? `🏷 ${job.tags.join(" · ")}\n` : "";
  return (
    `${index}. <b>${escapeHtml(job.jobName)}</b>\n` +
    `🏢 ${escapeHtml(job.custName)}\n` +
    `📍 ${escapeHtml(job.jobAddrNoDesc)}\n` +
    `💰 ${escapeHtml(job.salaryDesc)}\n` +
    `${tags}` +
    `🔗 <a href="${job.link}">查看職缺</a>\n` +
    `🕐 ${escapeHtml(job.periodDesc)}`
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
