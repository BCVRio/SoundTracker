import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createDatabase() {
  const db = new Database(path.join(__dirname, '../soundtracker.db'))

  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id          TEXT    PRIMARY KEY,
      crew_member TEXT    NOT NULL,
      scene       TEXT    NOT NULL,
      take        INTEGER NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      location    TEXT    NOT NULL DEFAULT '',
      latitude    REAL,
      longitude   REAL,
      date        TEXT    NOT NULL,
      time        TEXT    NOT NULL,
      notes       TEXT    NOT NULL DEFAULT '',
      created_at  INTEGER NOT NULL
    )
  `)

  return db
}
