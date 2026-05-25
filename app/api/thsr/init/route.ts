import { NextResponse } from 'next/server'

const THSR_BASE = 'https://irs.thsrc.com.tw'
const THSR_BOOKING = `${THSR_BASE}/IMINT/`

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
}

export async function GET() {
  try {
    const resp = await fetch(THSR_BOOKING, {
      method: 'GET',
      headers: HEADERS,
      redirect: 'follow',
    })

    if (!resp.ok) {
      throw new Error(`THSR responded with ${resp.status}`)
    }

    // Extract JSESSIONID from Set-Cookie header
    const setCookieHeader = resp.headers.get('set-cookie') || ''
    const jsessionMatch = setCookieHeader.match(/JSESSIONID=([^;]+)/)
    const jsessionId = jsessionMatch ? jsessionMatch[1] : null

    // Extract session from URL redirect
    const finalUrl = resp.url
    const urlSessionMatch = finalUrl.match(/IMINT\/([^?]+)/)
    const urlSession = urlSessionMatch ? urlSessionMatch[1] : null

    const html = await resp.text()

    // Extract action URL from form
    const formActionMatch = html.match(/action="([^"]*IMINT[^"]*)"/)
    const formAction = formActionMatch ? formActionMatch[1] : null

    // Extract wicket session from form action
    const wicketMatch = formAction?.match(/IMINT\/(.*?)\?/)
    const wicketSession = wicketMatch ? wicketMatch[1] : urlSession

    return NextResponse.json({
      success: true,
      jsessionId,
      wicketSession,
      finalUrl,
      formAction: formAction ? `${THSR_BASE}${formAction}` : null,
    })
  } catch (error) {
    console.error('THSR init error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
