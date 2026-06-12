import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import { createDatabase } from './db.js'
import { initSheets, appendRecording } from './sheets.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

const db = createDatabase()
initSheets()

// GET /api/recordings
app.get('/api/recordings', (req, res) => {
  const { crew_member, scene, date } = req.query
  let query = 'SELECT * FROM recordings'
  const conditions = []
  const params = []

  if (crew_member) { conditions.push('crew_member = ?'); params.push(crew_member) }
  if (scene)       { conditions.push('scene = ?');       params.push(scene) }
  if (date)        { conditions.push('date = ?');         params.push(date) }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY created_at DESC'

  try {
    res.json(db.prepare(query).all(...params))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// GET /api/recordings/next-take?scene=XXX
app.get('/api/recordings/next-take', (req, res) => {
  const { scene } = req.query
  if (!scene || !String(scene).trim()) return res.json({ nextTake: 1 })

  try {
    const row = db.prepare('SELECT MAX(take) as maxTake FROM recordings WHERE scene = ?').get(String(scene).trim())
    res.json({ nextTake: (row?.maxTake ?? 0) + 1 })
  } catch (err) {
    console.error(err)
    res.json({ nextTake: 1 })
  }
})

// POST /api/recordings
app.post('/api/recordings', (req, res) => {
  const { crew_member, scene, take, description, location, latitude, longitude, date, time, notes } = req.body

  if (!crew_member || !scene || !date || !time) {
    return res.status(400).json({ error: 'crew_member, scene, date and time are required' })
  }

  const id = uuidv4()
  const created_at = Date.now()

  try {
    db.prepare(`
      INSERT INTO recordings (id, crew_member, scene, take, description, location, latitude, longitude, date, time, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(crew_member),
      String(scene).trim(),
      Number(take) || 1,
      String(description ?? ''),
      String(location ?? ''),
      latitude != null ? Number(latitude) : null,
      longitude != null ? Number(longitude) : null,
      String(date),
      String(time),
      String(notes ?? ''),
      created_at,
    )

    const saved = db.prepare('SELECT * FROM recordings WHERE id = ?').get(id)
    appendRecording(saved)
    res.status(201).json(saved)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create recording' })
  }
})

// DELETE /api/recordings/:id
app.delete('/api/recordings/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM recordings WHERE id = ?').run(req.params.id)
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete recording' })
  }
})

// Serve built React app in production
if (isProd) {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SoundTracker server running on http://0.0.0.0:${PORT}`)
  if (isProd) console.log('Serving built React app from /dist')
})
