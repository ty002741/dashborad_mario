import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const { wellness, recentActivities } = await req.json();

    const prompt = `你是一位精通運動生理學的私人教練。根據以下運動員今天的生理數據，用繁體中文給出評估。

【今日生理數據】
體能 CTL：${wellness.ctl ?? "無資料"}（42天積累，越高代表體能越好）
疲勞 ATL：${wellness.atl ?? "無資料"}（7天積累，越高代表越疲勞）
競技狀態 TSB：${wellness.tsb ?? "無資料"}（正值=狀態好，負值=疲勞中）
HRV 心率變異：${wellness.hrv ?? "無資料"} ms（越高越好，代表自律神經恢復良好）
靜止心率：${wellness.restingHR ?? "無資料"} bpm（越低越好）
睡眠時數：${wellness.sleepHrs ?? "無資料"} 小時
睡眠品質分數：${wellness.sleepScore ?? "無資料"} / 100

【最近 3 筆活動】
${recentActivities.map((a: { date: string; type: string; name: string; distance: string; pace: string }) => `- ${a.date} ${a.type}《${a.name}》距離 ${a.distance}，配速 ${a.pace}`).join("\n")}

請以 JSON 格式回傳，不要加 markdown code block，只回傳純 JSON：
{
  "status": "green" 或 "yellow" 或 "red",
  "headline": "一句話結論（15字以內）",
  "summary": "根據數據的白話解釋（40-60字，說明為什麼是這個狀態）",
  "recommendation": "今天具體該做什麼（30字以內，直接給建議）"
}

判斷標準：
- green：TSB > 5 且 HRV 正常且睡眠 > 6h → 適合訓練
- yellow：TSB 0~5 或睡眠不足或 HRV 偏低 → 輕鬆活動
- red：TSB < 0 或 HRV 明顯偏低或睡眠 < 5h → 建議休息`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // 清理可能的 markdown 包裝
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(clean);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[daily-summary]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
