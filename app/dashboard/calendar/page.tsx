import { fetchActivities } from '@/lib/intervals'
import { getActivityLabel } from '@/lib/transforms'
import CalendarClient from '@/components/dashboard/CalendarClient'

export default async function CalendarPage() {
  const now = new Date()
  const newest = now.toISOString().split('T')[0]
  const oldest = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const activities = await fetchActivities(oldest, newest)

  const byDate: Record<string, { type: string; name: string; distance: string }[]> = {}
  activities.forEach(a => {
    const date = a.start_date_local.split('T')[0]
    if (!byDate[date]) byDate[date] = []
    byDate[date].push({
      type: getActivityLabel(a.type),
      name: a.name,
      distance: a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '--',
    })
  })

  return <CalendarClient byDate={byDate} />
}
