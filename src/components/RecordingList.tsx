import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Loader2, Mic2, RefreshCw, AlertCircle } from 'lucide-react'
import RecordingCard from './RecordingCard'
import type { Recording } from '../types'
import { deleteRecording } from '../api'

interface RecordingListProps {
  recordings: Recording[]
  loading: boolean
  error: string | null
  crewMember: string
  onRefresh: () => void
}

export default function RecordingList({
  recordings,
  loading,
  error,
  crewMember,
  onRefresh,
}: RecordingListProps) {
  const [search, setSearch] = useState('')
  const [filterMine, setFilterMine] = useState(false)

  const filtered = useMemo(() => {
    return recordings.filter((r) => {
      if (filterMine && r.crew_member !== crewMember) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          r.scene.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.location ?? '').toLowerCase().includes(q) ||
          r.crew_member.toLowerCase().includes(q) ||
          (r.notes ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [recordings, search, filterMine, crewMember])

  const handleDelete = async (id: string) => {
    await deleteRecording(id)
    onRefresh()
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recordings…"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors min-h-[44px]"
          />
        </div>
        <button
          onClick={() => setFilterMine((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors min-h-[44px] shrink-0 ${
            filterMine
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 active:border-zinc-600'
          }`}
          title={filterMine ? 'Show all crew' : 'Show only my recordings'}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{filterMine ? 'Mine' : 'All'}</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 active:text-zinc-200 hover:border-zinc-600 active:border-zinc-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-4 px-1">
        <span>
          {filtered.length} {filtered.length === 1 ? 'recording' : 'recordings'}
          {(search || filterMine) && ` of ${recordings.length}`}
        </span>
        {filterMine && (
          <span className="text-amber-500/70">Showing your recordings only</span>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <AlertCircle className="w-10 h-10 mb-3 text-red-500/50" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={onRefresh}
            className="mt-4 text-sm text-amber-500 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading recordings…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Mic2 className="w-12 h-12 mb-3 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            {search || filterMine
              ? 'No recordings match your filters'
              : 'No recordings yet — tap "New Take" to start logging'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RecordingCard
              key={r.id}
              recording={r}
              isOwn={r.crew_member === crewMember}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
