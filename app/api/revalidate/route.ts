import { revalidatePath } from "next/cache";

export async function GET() {
  revalidatePath("/dashboard");
  return Response.json({ ok: true, revalidated: new Date().toISOString() });
}
