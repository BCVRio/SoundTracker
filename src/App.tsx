import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import CrewSetup from './components/CrewSetup'
import RecordingForm from './components/RecordingForm'
import RecordingList from './components/RecordingList'
import type { Recording } from './types'
import { getRecordings } from './api'

type View = 'list' | 'form'

export default function App() {
  const [crewMember, setCrewMember] = useState<string>(
    () => localStorage.getItem('crewMember') ?? '',
  )
  const [view, setView] = useState<View>('list')
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecordings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecordings()
      setRecordings(data)
    } catch {
      setError('Could not load recordings. Is the server running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (crewMember) loadRecordings()
  }, [crewMember, loadRecordings])

  const handleSetCrew = (name: string) => {
    localStorage.setItem('crewMember', name)
    setCrewMember(name)
  }

  const handleChangeCrew = () => {
    localStorage.removeItem('crewMember')
    setCrewMember('')
    setView('list')
  }

  if (!crewMember) {
    return <CrewSetup onSetup={handleSetCrew} />
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        crewMember={crewMember}
        onChangeCrew={handleChangeCrew}
        onNewRecording={() => setView('form')}
        showingForm={view === 'form'}
      />
      <main className="max-w-2xl mx-auto px-4 py-5 pb-safe">
        {view === 'form' ? (
          <RecordingForm
            crewMember={crewMember}
            onSuccess={() => {
              setView('list')
              loadRecordings()
            }}
            onCancel={() => setView('list')}
          />
        ) : (
          <RecordingList
            recordings={recordings}
            loading={loading}
            error={error}
            crewMember={crewMember}
            onRefresh={loadRecordings}
          />
        )}
      </main>
    </div>
  )
}
