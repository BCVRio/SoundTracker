import type { NewRecording, Recording } from './types'

const BASE = '/api'

export async function getRecordings(filters?: {
  crew_member?: string
  scene?: string
  date?: string
}): Promise<Recording[]> {
  const params = new URLSearchParams()
  if (filters?.crew_member) params.set('crew_member', filters.crew_member)
  if (filters?.scene) params.set('scene', filters.scene)
  if (filters?.date) params.set('date', filters.date)
  const qs = params.toString()
  const res = await fetch(`${BASE}/recordings${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error('Failed to fetch recordings')
  return res.json()
}

export async function getNextTake(scene: string): Promise<number> {
  if (!scene.trim()) return 1
  const res = await fetch(
    `${BASE}/recordings/next-take?scene=${encodeURIComponent(scene.trim())}`,
  )
  if (!res.ok) return 1
  const { nextTake } = await res.json()
  return nextTake
}

export async function createRecording(recording: NewRecording): Promise<Recording> {
  const res = await fetch(`${BASE}/recordings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recording),
  })
  if (!res.ok) throw new Error('Failed to create recording')
  return res.json()
}

export async function deleteRecording(id: string): Promise<void> {
  await fetch(`${BASE}/recordings/${id}`, { method: 'DELETE' })
}
