import { NextRequest, NextResponse } from 'next/server'

const THSR_BASE = 'https://irs.thsrc.com.tw'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Origin': THSR_BASE,
}

// Step 1: Select a train from the list
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, sessionId, formUrl, trainNo, captcha, passengerId, phone } = body

    if (!action) {
      return NextResponse.json({ success: false, error: '缺少 action 參數' }, { status: 400 })
    }

    const cookieHeader = sessionId ? `JSESSIONID=${sessionId}` : ''

    if (action === 'select-train') {
      // Submit train selection form
      if (!trainNo || !formUrl) {
        return NextResponse.json({ success: false, error: '缺少車次或表單 URL' }, { status: 400 })
      }

      const formData = new URLSearchParams()
      formData.append('BookingS1Form:hf:0', '')
      formData.append('TrainQueryDataViewPanel:TrainGroup', trainNo)
      formData.append('SubmitButton', '下一步')

      const resp = await fetch(formUrl, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'Referer': `${THSR_BASE}/IMINT/`,
          ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        },
        body: formData.toString(),
        redirect: 'follow',
      })

      const html = await resp.text()
      const finalUrl = resp.url

      // Extract captcha URL from passenger info page
      const captchaPatterns = [
        /src="([^"]*captcha[^"]*\.(?:jpg|jpeg|png|gif)[^"]*)"/i,
        /src="([^"]*security[^"]*\.(?:jpg|jpeg|png|gif)[^"]*)"/i,
        /<img[^>]*id="[^"]*security[^"]*"[^>]*src="([^"]+)"/i,
      ]
      let captchaUrl = null
      for (const pattern of captchaPatterns) {
        const match = html.match(pattern)
        if (match) {
          captchaUrl = match[1].startsWith('http') ? match[1] : `${THSR_BASE}${match[1]}`
          break
        }
      }

      // Check if we're on the passenger form page
      const isPassengerPage = html.includes('idInputField') || html.includes('passenger') || captchaUrl !== null

      return NextResponse.json({
        success: true,
        isPassengerPage,
        captchaUrl,
        finalUrl,
        sessionId: cookieHeader || sessionId,
      })
    }

    if (action === 'submit-passenger') {
      // Submit passenger info with captcha
      if (!passengerId || !captcha || !formUrl) {
        return NextResponse.json({ success: false, error: '缺少旅客資料' }, { status: 400 })
      }

      const formData = new URLSearchParams()
      formData.append('BookingS2Form:hf:0', '')
      formData.append('idInputField', passengerId)
      formData.append('phoneInputField', phone || '')
      formData.append('homeCaptcha:securityCode', captcha)
      formData.append('SubmitButton', '確認訂位')

      const resp = await fetch(formUrl, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'Referer': `${THSR_BASE}/IMINT/`,
          ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        },
        body: formData.toString(),
        redirect: 'follow',
      })

      const html = await resp.text()
      const finalUrl = resp.url

      // Check for success - booking confirmation page
      const isSuccess = html.includes('BookingS3') ||
        html.includes('訂位成功') ||
        html.includes('預約成功') ||
        html.includes('booking_code') ||
        html.includes('confirmation')

      // Check for errors
      const errorMatch = html.match(/class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
      const errorMsg = errorMatch
        ? errorMatch[1].replace(/<[^>]*>/g, '').trim()
        : null

      // Extract confirmation number if success
      const confirmMatch = html.match(/(?:訂位代號|確認碼|Booking\s*Code)[^\d]*(\d{4,})/i)
      const confirmCode = confirmMatch ? confirmMatch[1] : null

      return NextResponse.json({
        success: isSuccess,
        confirmCode,
        errorMsg,
        finalUrl,
        html: html.substring(0, 2000), // return partial html for debugging
      })
    }

    return NextResponse.json({ success: false, error: '未知的 action' }, { status: 400 })

  } catch (error) {
    console.error('THSR book error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
