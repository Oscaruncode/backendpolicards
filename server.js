const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const cors = require('cors')

const app = express()

app.use(cors({
  origin: '*'
}))

app.use(express.json())

// 📦 DB
const db = new sqlite3.Database('./votes.db')

// Crear tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT,
    candidateId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// POST votos
app.post('/api/votes', (req, res) => {
  const { candidateIds } = req.body

  if (!candidateIds || candidateIds.length !== 4) {
    return res.status(400).json({ error: 'Invalid data' })
  }

  const sessionId = Date.now().toString()

  const stmt = db.prepare(`
    INSERT INTO votes (sessionId, candidateId)
    VALUES (?, ?)
  `)

  candidateIds.forEach(id => {
    stmt.run(sessionId, id, (err) => {
      if (err) {
        console.error('Error inserting vote:', err)
      }
    })
  })

  stmt.finalize()

  res.json({ success: true })
})

// GET ranking
app.get('/api/votes/popularity', (req, res) => {
  db.all(`
    SELECT candidateId, COUNT(*) as totalVotes
    FROM votes
    GROUP BY candidateId
    ORDER BY totalVotes DESC
  `, (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

// 🔥 IMPORTANTE PARA RENDER
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})