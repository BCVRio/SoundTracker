import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapPin,
  Clock,
  Calendar,
  Hash,
  FileText,
  Save,
  X,
  Loader2,
  Navigation,
  Mic2,
  RefreshCw,
} from 'lucide-react'
import { createRecording, getNextTake } from '../api'
import type { NewRecording } from '../types'

interface RecordingFormProps {
  crewMember: string
  onSuccess: () => void
  onCancel: () => void
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getNow() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function RecordingForm({ crewMember, onSuccess, onCancel }: RecordingFormProps) {
  const [form, setForm] = useState<NewRecording>({
    crew_member: crewMember,
    scene: '',
    take: 1,
    description: '',
    location: '',
    latitude: undefined,
    longitude: undefined,
    date: getToday(),
    time: getNow(),
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [takeAuto, setTakeAuto] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const takeAutoRef = useRef(true)

  useEffect(() => {
    takeAutoRef.current = takeAuto
  }, [takeAuto])

  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        let locationName = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } },
          )
          const data = await res.json()
          if (data.address) {
            const a = data.address
            if (a.road && (a.suburb || a.city || a.town)) {
              locationName = `${a.road}, ${a.suburb ?? a.city ?? a.town}`
            } else if (a.suburb && (a.city || a.town)) {
              locationName = `${a.suburb}, ${a.city ?? a.town}`
            } else if (a.city || a.town || a.village) {
              locationName = a.city ?? a.town ?? a.village
            }
          }
        } catch {
          // keep coordinates as fallback
        }
        setForm((f) => ({ ...f, location: locationName, latitude, longitude }))
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 120000 },
    )
  }, [])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  // Auto-increment take when scene changes (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!takeAutoRef.current) return

    if (!form.scene.trim()) {
      setForm((f) => ({ ...f, take: 1 }))
      return
    }

    const scene = form.scene.trim()
    debounceRef.current = setTimeout(async () => {
      if (!takeAutoRef.current) return
      const nextTake = await getNextTake(scene)
      if (takeAutoRef.current) setForm((f) => ({ ...f, take: nextTake }))
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form.scene])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaving(true)
    try {
      await createRecording(form)
      onSuccess()
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const setField =
    (field: keyof NewRecording) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const canSubmit = form.scene.trim() && form.description.trim() && !saving

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">New Recording</h2>
          <p className="text-sm text-zinc-400 mt-0.5">Logging as {crewMember}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-zinc-400 hover:text-zinc-200 active:text-zinc-200 rounded-xl hover:bg-zinc-800 active:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Slate */}
        <section className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Slate
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                <Hash className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Scene
              </label>
              <input
                type="text"
                value={form.scene}
                onChange={setField('scene')}
                placeholder="5A, 12, CU-Kitchen…"
                required
                autoCapitalize="characters"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                <Mic2 className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Take
              </label>
              <input
                type="number"
                min="1"
                value={form.take}
                onChange={(e) => {
                  setTakeAuto(false)
                  setForm((f) => ({ ...f, take: parseInt(e.target.value) || 1 }))
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
              />
              {takeAuto && form.scene.trim() && (
                <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Auto-set
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            <FileText className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            Description
          </label>
          <textarea
            value={form.description}
            onChange={setField('description')}
            placeholder="Dialogue, wild track, atmos, room tone, FX…"
            required
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none text-base"
          />
        </section>

        {/* When & Where */}
        <section className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            When &amp; Where
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                <Calendar className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={setField('date')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={setField('time')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              <MapPin className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.location}
                onChange={setField('location')}
                placeholder={locating ? 'Getting location…' : 'Location name or address'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 pr-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
              />
              <button
                type="button"
                onClick={fetchLocation}
                disabled={locating}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-zinc-400 hover:text-amber-500 active:text-amber-500 disabled:text-zinc-600 transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Get GPS location"
              >
                {locating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Notes{' '}
            <span className="text-zinc-600 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={setField('notes')}
            placeholder="Noise issues, wind, director's notes…"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors resize-none text-base"
          />
        </section>

        {saveError && (
          <p className="text-sm text-red-400 text-center">{saveError}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 active:border-zinc-600 active:text-zinc-200 transition-colors font-semibold text-base min-h-[52px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-900 font-bold transition-colors text-base min-h-[52px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Recording
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
