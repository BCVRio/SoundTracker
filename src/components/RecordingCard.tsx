import { useState } from 'react'
import { MapPin, Clock, Calendar, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react'
import type { Recording } from '../types'

interface RecordingCardProps {
  recording: Recording
  isOwn: boolean
  onDelete: () => void
}

export default function RecordingCard({ recording: r, isOwn, onDelete }: RecordingCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    onDelete()
  }

  return (
    <div
      className={`bg-zinc-900 rounded-2xl border transition-colors ${
        isOwn ? 'border-zinc-700' : 'border-zinc-800'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Slate badge */}
          <div className="shrink-0 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-center min-w-[58px]">
            <div className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider leading-none">
              Scene
            </div>
            <div className="text-base font-bold text-amber-400 leading-tight mt-0.5 break-all">
              {r.scene}
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5 leading-none">
              Take {r.take}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-100 leading-snug line-clamp-2">
              {r.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[100px]">{r.crew_member}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                {r.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                {r.time}
              </span>
              {r.location && (
                <span className="flex items-center gap-1 max-w-full">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{r.location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-1">
            {r.notes && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-2.5 text-zinc-500 hover:text-zinc-300 active:text-zinc-300 transition-colors rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
              >
                {expanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
            {isOwn && (
              <button
                onClick={handleDelete}
                className={`p-2.5 transition-colors rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  confirming
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-zinc-600 hover:text-red-400 active:text-red-400'
                }`}
                title={confirming ? 'Tap again to confirm delete' : 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {confirming && (
          <p className="text-xs text-red-400 mt-2 text-right">Tap again to confirm delete</p>
        )}

        {expanded && r.notes && (
          <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-400 leading-relaxed">
            {r.notes}
          </div>
        )}
      </div>
    </div>
  )
}
