import { NextRequest, NextResponse } from 'next/server'

const THSR_BASE = 'https://irs.thsrc.com.tw'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const captchaPath = searchParams.get('path')

  if (!captchaPath) {
    return NextResponse.json({ error: '缺少 captcha path' }, { status: 400 })
  }

  try {
    const captchaUrl = captchaPath.startsWith('http')
      ? captchaPath
      : `${THSR_BASE}${captchaPath}`

    const resp = await fetch(captchaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${THSR_BASE}/IMINT/`,
        ...(sessionId ? { 'Cookie': `JSESSIONID=${sessionId}` } : {}),
      },
    })

    if (!resp.ok) {
      return NextResponse.json({ error: `Failed to fetch captcha: ${resp.status}` }, { status: 502 })
    }

    const buffer = await resp.arrayBuffer()
    const contentType = resp.headers.get('content-type') || 'image/jpeg'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
