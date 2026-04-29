import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: Request) {
  try {
    const workout = await req.json();

    const prompt = `你是一位嚴格但專業的跑步與自行車教練，精通運動生理學。根據以下訓練數據，用繁體中文給出約 60 字的精準短評與下次訓練建議。語氣像教練直接講話，不要加標題或條列，直接輸出評語。

這次訓練數據：
活動名稱：${workout.name}
類型：${workout.type}
距離：${workout.distance}
移動時間：${workout.movingTime}
平均配速：${workout.avgPace}
平均心率：${workout.avgHr ?? "無資料"} bpm
最大心率：${workout.maxHr ?? "無資料"} bpm
總爬升：${workout.elevation}

請給短評與下次訓練建議。`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return Response.json({ analysis: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze-workout]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
