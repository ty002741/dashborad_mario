// THSR Taiwan High Speed Rail - constants and types

export const THSR_STATIONS = [
  { id: '0980', name: '南港', nameEn: 'Nangang' },
  { id: '1000', name: '台北', nameEn: 'Taipei' },
  { id: '1020', name: '板橋', nameEn: 'Banqiao' },
  { id: '1040', name: '桃園', nameEn: 'Taoyuan' },
  { id: '1060', name: '新竹', nameEn: 'Hsinchu' },
  { id: '1070', name: '苗栗', nameEn: 'Miaoli' },
  { id: '1080', name: '台中', nameEn: 'Taichung' },
  { id: '1090', name: '彰化', nameEn: 'Changhua' },
  { id: '1100', name: '雲林', nameEn: 'Yunlin' },
  { id: '1110', name: '嘉義', nameEn: 'Chiayi' },
  { id: '1120', name: '台南', nameEn: 'Tainan' },
  { id: '1130', name: '左營', nameEn: 'Zuoying' },
]

export const THSR_TIME_SLOTS = [
  { value: '0', label: '不限時間' },
  { value: '1', label: '06:00 - 07:00' },
  { value: '2', label: '07:00 - 08:00' },
  { value: '3', label: '08:00 - 09:00' },
  { value: '4', label: '09:00 - 10:00' },
  { value: '5', label: '10:00 - 11:00' },
  { value: '6', label: '11:00 - 12:00' },
  { value: '7', label: '12:00 - 13:00' },
  { value: '8', label: '13:00 - 14:00' },
  { value: '9', label: '14:00 - 15:00' },
  { value: '10', label: '15:00 - 16:00' },
  { value: '11', label: '16:00 - 17:00' },
  { value: '12', label: '17:00 - 18:00' },
  { value: '13', label: '18:00 - 19:00' },
  { value: '14', label: '19:00 - 20:00' },
  { value: '15', label: '20:00 - 21:00' },
  { value: '16', label: '21:00 - 22:00' },
  { value: '17', label: '22:00 - 23:00' },
  { value: '18', label: '23:00 - 24:00' },
]

export const SEAT_TYPES = [
  { value: 'S', label: '標準車廂' },
  { value: 'B', label: '商務車廂' },
]

export interface THSRSearchParams {
  fromStation: string
  toStation: string
  date: string       // YYYY/MM/DD
  timeSlot: string   // 0-18
  adultCount: number
  seatType: string   // 'S' or 'B'
}

export interface THSRTrain {
  no: string
  departTime: string
  arriveTime: string
  duration: string
  businessAvailable: boolean
  standardAvailable: boolean
  discount?: string
}

export interface THSRBookingSession {
  sessionId: string
  trains: THSRTrain[]
  captchaUrl: string
  formData: Record<string, string>
}

export interface HunterConfig {
  searchParams: THSRSearchParams
  targetTrainNos: string[]   // empty = any train
  intervalSeconds: number
  maxAttempts: number
  passengerId: string
  passengerPhone: string
}

export interface HunterStatus {
  running: boolean
  attempts: number
  lastChecked: string | null
  lastResult: string | null
  foundTickets: THSRTrain[]
  log: string[]
}
