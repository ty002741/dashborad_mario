import { NextRequest, NextResponse } from 'next/server'
import { THSRTrain } from '@/lib/thsr'

const THSR_BASE = 'https://irs.thsrc.com.tw'
const THSR_BOOKING = `${THSR_BASE}/IMINT/`

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Content-Type': 'application/x-www-form-urlencoded',
  'Origin': THSR_BASE,
  'Referer': THSR_BOOKING,
}

function buildBookingForm(params: {
  fromStation: string
  toStation: string
  date: string
  timeSlot: string
  adultCount: number
  seatType: string
}) {
  const formData = new URLSearchParams()
  formData.append('BookingS0Form:hf:0', '')
  formData.append('selectStartStation', params.fromStation)
  formData.append('selectDestinationStation', params.toStation)
  formData.append('toTimeInputField', params.date)
  formData.append('trainCon:trainRadioGroup', params.timeSlot)
  formData.append('seatCon:seatRadioGroup', params.seatType)
  formData.append('ticketPanel:rows:0:ticketAmount', String(params.adultCount))
  formData.append('ticketPanel:rows:1:ticketAmount', '0')
  formData.append('ticketPanel:rows:2:ticketAmount', '0')
  formData.append('ticketPanel:rows:3:ticketAmount', '0')
  formData.append('ticketPanel:rows:4:ticketAmount', '0')
  formData.append('SubmitButton', '開始查詢')
  return formData
}

function parseTrains(html: string): THSRTrain[] {
  const trains: THSRTrain[] = []

  // Match train rows - THSR uses a table with train info
  // Pattern matches train number, depart time, arrive time in the results table
  const trainRowRegex = /class="[^"]*result[^"]*"[\s\S]*?<\/tr>/gi

  // Try to extract train info using regex patterns from THSR result page
  const tableRegex = /<table[^>]*id="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/table>/i
  const tableMatch = html.match(tableRegex)

  if (!tableMatch) {
    // Try alternative pattern - look for train data in any table
    const trainNumRegex = /\b(1[0-9]{3}|[0-9]{4})\b.*?(\d{2}:\d{2}).*?(\d{2}:\d{2})/g
    let m
    while ((m = trainNumRegex.exec(html)) !== null) {
      if (trains.length >= 20) break
    }
    return trains
  }

  // Parse rows in the results table
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const tableContent = tableMatch[1]
  let rowMatch

  while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
    const row = rowMatch[1]

    // Skip header rows
    if (/<th/i.test(row)) continue

    // Extract train number
    const trainNoMatch = row.match(/(?:車次|No\.?)[^\d]*(\d{3,4})|<td[^>]*>(\d{3,4})<\/td>/i)
    const trainNo = trainNoMatch ? (trainNoMatch[1] || trainNoMatch[2]) : null
    if (!trainNo) continue

    // Extract times (HH:MM format)
    const timeMatches = row.match(/\d{2}:\d{2}/g)
    if (!timeMatches || timeMatches.length < 2) continue

    const departTime = timeMatches[0]
    const arriveTime = timeMatches[1]

    // Calculate duration
    const [dh, dm] = departTime.split(':').map(Number)
    const [ah, am] = arriveTime.split(':').map(Number)
    const totalMin = (ah * 60 + am) - (dh * 60 + dm)
    const duration = totalMin > 0 ? `${Math.floor(totalMin / 60)}時${totalMin % 60}分` : ''

    // Check seat availability
    const businessAvailable = !/(售完|sold.?out|no.?seat)/i.test(
      row.replace(/<[^>]*>/g, ' ')
        .split(departTime)[0] // rough split
    )
    const standardAvailable = true // default, would need more parsing

    // Check for discount
    const discountMatch = row.match(/([0-9]+)折|早[鳥烏]|優惠/i)
    const discount = discountMatch ? discountMatch[0] : undefined

    trains.push({
      no: trainNo,
      departTime,
      arriveTime,
      duration,
      businessAvailable,
      standardAvailable,
      discount,
    })
  }

  return trains
}

function parseCaptchaUrl(html: string): string | null {
  // Look for captcha image src
  const captchaPatterns = [
    /src="([^"]*captcha[^"]*\.(?:jpg|jpeg|png|gif)[^"]*)"/i,
    /src="([^"]*security[^"]*\.(?:jpg|jpeg|png|gif)[^"]*)"/i,
    /src="([^"]*verify[^"]*\.(?:jpg|jpeg|png|gif)[^"]*)"/i,
    /<img[^>]*id="[^"]*captcha[^"]*"[^>]*src="([^"]+)"/i,
    /id="[^"]*captcha[^"]*"[^>]*src="([^"]+)"/i,
  ]

  for (const pattern of captchaPatterns) {
    const match = html.match(pattern)
    if (match) {
      const url = match[1]
      if (url.startsWith('http')) return url
      if (url.startsWith('/')) return `https://irs.thsrc.com.tw${url}`
      return url
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromStation, toStation, date, timeSlot, adultCount, seatType } = body

    if (!fromStation || !toStation || !date) {
      return NextResponse.json({ success: false, error: '缺少必要參數' }, { status: 400 })
    }

    // Step 1: Initialize session
    const initResp = await fetch(THSR_BOOKING, {
      method: 'GET',
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        'Accept': HEADERS['Accept'],
        'Accept-Language': HEADERS['Accept-Language'],
      },
      redirect: 'follow',
    })

    const initSetCookie = initResp.headers.get('set-cookie') || ''
    const jsessionMatch = initSetCookie.match(/JSESSIONID=([^;,\s]+)/)
    const jsessionId = jsessionMatch ? jsessionMatch[1] : null

    const initHtml = await initResp.text()

    // Extract form action URL
    const formActionMatch = initHtml.match(/action="([^"]*IMINT[^"]*)"/)
    let formAction = formActionMatch ? formActionMatch[1] : '/IMINT/'
    if (!formAction.startsWith('http')) {
      formAction = `${THSR_BASE}${formAction}`
    }

    const cookieHeader = jsessionId ? `JSESSIONID=${jsessionId}` : ''

    // Step 2: Submit booking form
    const formData = buildBookingForm({
      fromStation,
      toStation,
      date,
      timeSlot: timeSlot || '0',
      adultCount: adultCount || 1,
      seatType: seatType || 'S',
    })

    const searchResp = await fetch(formAction, {
      method: 'POST',
      headers: {
        ...HEADERS,
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
      },
      body: formData.toString(),
      redirect: 'follow',
    })

    const searchSetCookie = searchResp.headers.get('set-cookie') || ''
    const searchJsession = searchSetCookie.match(/JSESSIONID=([^;,\s]+)/)
    const sessionId = searchJsession ? searchJsession[1] : jsessionId
    const finalUrl = searchResp.url

    const html = await searchResp.text()

    // Parse trains from response
    const trains = parseTrains(html)

    // Parse captcha URL
    const captchaUrl = parseCaptchaUrl(html)

    // Check for error messages
    const errorMatch = html.match(/class="[^"]*error[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/i)
    const errorMsg = errorMatch ? errorMatch[1].replace(/<[^>]*>/g, '').trim() : null

    // Check if we got to the train selection page
    const isTrainPage = html.includes('BookingS1') || html.includes('trainRadioGroup') || trains.length > 0

    return NextResponse.json({
      success: true,
      trains,
      captchaUrl,
      sessionId,
      finalUrl,
      isTrainPage,
      errorMsg,
      hasResults: trains.length > 0,
    })

  } catch (error) {
    console.error('THSR trains error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
