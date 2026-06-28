export const dynamic = 'force-dynamic'

import { fetchActivities } from '@/lib/intervals'
import { getActivityLabel, secondsToPace } from '@/lib/transforms'
import ActivitiesClient from '@/components/dashboard/ActivitiesClient'

export default async function ActivitiesPage() {
  const now = new Date()
  const newest = now.toISOString().split('T')[0]
  const oldest = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const activities = await fetchActivities(oldest, newest)

  const rows = activities.map(a => {
    const isRun = a.type === 'Run' || a.type === 'VirtualRun'
    const isRide = a.type === 'Ride' || a.type === 'VirtualRide'

    let pace = '--'
    if (isRun && a.average_speed > 0)
      pace = `${secondsToPace(Math.round(1000 / a.average_speed))} /km`
    else if (isRide && a.average_speed > 0)
      pace = `${(a.average_speed * 3.6).toFixed(1)} km/h`

    const totalMins = a.moving_time ? Math.floor(a.moving_time / 60) : 0
    const hrs = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    const duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`

    return {
      id: a.id,
      date: a.start_date_local.split('T')[0],
      type: getActivityLabel(a.type),
      name: a.name,
      distance: a.distance ? `${(a.distance / 1000).toFixed(1)} km` : '--',
      duration,
      pace,
      hr: a.average_heartrate ? `${Math.round(a.average_heartrate)} bpm` : '--',
      elevation: a.total_elevation_gain ? `${Math.round(a.total_elevation_gain)} m` : '--',
    }
  })

  return <ActivitiesClient rows={rows} />
}
