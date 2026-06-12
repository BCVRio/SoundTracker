export interface Recording {
  id: string
  crew_member: string
  scene: string
  take: number
  description: string
  location: string
  latitude: number | null
  longitude: number | null
  date: string
  time: string
  notes: string
  created_at: number
}

export interface NewRecording {
  crew_member: string
  scene: string
  take: number
  description: string
  location: string
  latitude?: number
  longitude?: number
  date: string
  time: string
  notes: string
}
