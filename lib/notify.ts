/**
 * Fire-and-forget push notification trigger.
 * Calls the /api/notify route — safe to call from any client component.
 */
export function notifyTrip(
  tripId: string,
  event: 'new_task' | 'new_payment' | 'new_message' | 'new_plan' | 'new_trip',
  title: string,
  body: string,
  actorId: string
) {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tripId, event, title, body, actorId }),
  }).catch(() => { /* best-effort */ });
}
