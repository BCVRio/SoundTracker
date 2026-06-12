import { Mic2, Plus, User, ChevronDown } from 'lucide-react'

interface HeaderProps {
  crewMember: string
  onChangeCrew: () => void
  onNewRecording: () => void
  showingForm: boolean
}

export default function Header({
  crewMember,
  onChangeCrew,
  onNewRecording,
  showingForm,
}: HeaderProps) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 bg-amber-500 rounded-xl p-1.5">
            <Mic2 className="w-5 h-5 text-zinc-900" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight leading-none">SoundTracker</h1>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">Production Sound Log</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onChangeCrew}
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 active:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800 active:bg-zinc-800 min-h-[40px]"
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-[90px] truncate">{crewMember}</span>
            <ChevronDown className="w-3 h-3 shrink-0" />
          </button>

          {!showingForm && (
            <button
              onClick={onNewRecording}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-900 font-semibold text-sm px-3 py-2 rounded-xl transition-colors min-h-[40px]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Take</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
