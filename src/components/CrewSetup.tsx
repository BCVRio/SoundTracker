import { useState } from 'react'
import { Mic2, ArrowRight } from 'lucide-react'

interface CrewSetupProps {
  onSetup: (name: string) => void
}

export default function CrewSetup({ onSetup }: CrewSetupProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSetup(trimmed)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex bg-amber-500 rounded-2xl p-4 mb-4 shadow-lg shadow-amber-500/20">
            <Mic2 className="w-10 h-10 text-zinc-900" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SoundTracker</h1>
          <p className="text-zinc-400 mt-2 text-sm">Production Sound Logging</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl"
        >
          <h2 className="text-lg font-semibold text-zinc-100 mb-1">Who are you?</h2>
          <p className="text-sm text-zinc-400 mb-5">
            Enter your name so the team can see your recordings
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex — Boom Op"
            autoFocus
            autoCapitalize="words"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-base"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-900 font-bold py-3.5 rounded-xl transition-colors text-base"
          >
            Start Logging
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-5">
          Your name is saved on this device
        </p>
      </div>
    </div>
  )
}
