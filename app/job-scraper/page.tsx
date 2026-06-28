"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { scrape104Jobs, type Job104 } from "@/lib/scraper104";

const AREA_OPTIONS = [
  { value: "", label: "全台灣" },
  { value: "6001001000", label: "台北市" },
  { value: "6001002000", label: "新北市" },
  { value: "6001003000", label: "桃園市" },
  { value: "6001005000", label: "台中市" },
  { value: "6001007000", label: "台南市" },
  { value: "6001008000", label: "高雄市" },
];

export default function JobScraperPage() {
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");
  const [pages, setPages] = useState(1);
  const [listedOnly, setListedOnly] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job104[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setStatus("");
    setJobs([]);
    setTotalCount(0);

    try {
      const allJobs: Job104[] = [];
      let count = 0;

      for (let p = 1; p <= Math.min(pages, 5); p++) {
        setStatus(`正在抓取第 ${p} 頁...`);
        const result = await scrape104Jobs({ keyword, area, page: p, listedOnly });
        allJobs.push(...result.jobs);
        count = result.totalCount;
      }

      setJobs(allJobs);
      setTotalCount(count);
      setStatus(`完成！共找到 ${count} 筆，顯示 ${allJobs.length} 筆`);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTelegram() {
    if (jobs.length === 0) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/job-scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs,
          totalCount,
          keyword,
          botToken: botToken || undefined,
          chatId: chatId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(`已傳送 ${data.sent} 筆職缺到 Telegram！`);
    } catch (err) {
      setError(`Telegram 傳送失敗：${err}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">104 職缺爬蟲</h1>
          <p className="text-muted-foreground text-sm mt-1">
            搜尋上市上櫃公司職缺，傳送到 Telegram
          </p>
        </div>

        {/* Search Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">搜尋設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">關鍵字</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="例：工程師、會計、行銷"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">工作地點</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {AREA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  爬取頁數（每頁約 20 筆，最多 5 頁）
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={pages}
                  onChange={(e) => setPages(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-3 pt-5">
                <input
                  id="listedOnly"
                  type="checkbox"
                  checked={listedOnly}
                  onChange={(e) => setListedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="listedOnly" className="text-sm font-medium text-foreground cursor-pointer">
                  只顯示上市上櫃公司
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Telegram 設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              留空則使用伺服器預設設定（已設定好你的帳號）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Bot Token（選填）</label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="使用預設設定"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Chat ID（選填）</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="使用預設設定"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleSearch} disabled={loading || sending} variant="outline">
            {loading ? status || "搜尋中..." : "搜尋職缺"}
          </Button>
          <Button
            onClick={handleSendTelegram}
            disabled={loading || sending || jobs.length === 0}
          >
            {sending ? "傳送中..." : `傳送到 Telegram${jobs.length > 0 ? ` (${jobs.length} 筆)` : ""}`}
          </Button>
        </div>

        {/* Status / Error */}
        {status && !loading && !sending && (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground hover:text-primary transition-colors leading-snug block"
                      >
                        {job.jobName}
                      </a>
                      <p className="text-sm text-muted-foreground">{job.custName}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                        {job.jobAddrNoDesc && <span>📍 {job.jobAddrNoDesc}</span>}
                        {job.salaryDesc && <span>💰 {job.salaryDesc}</span>}
                        {job.periodDesc && <span>🕐 {job.periodDesc}</span>}
                      </div>
                      {job.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap pt-1">
                          {job.tags.map((tag, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <a
                      href={job.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      查看 →
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
