const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()

app.use(cors({
  origin: '*'
}))

app.use(express.json())

// 🔥 conexión a PostgreSQL (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario en Render
  },
})

// 🔥 crear tabla si no existe
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        session_id TEXT,
        candidate_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('DB ready')
  } catch (err) {
    console.error('DB init error:', err)
  }
}

initDB()

// POST votos
app.post('/api/votes', async (req, res) => {
  const { candidateIds } = req.body

  if (!candidateIds || candidateIds.length !== 4) {
    return res.status(400).json({ error: 'Invalid data' })
  }

  const sessionId = Date.now().toString()

  try {
    for (const id of candidateIds) {
      await pool.query(
        `INSERT INTO votes (session_id, candidate_id) VALUES ($1, $2)`,
        [sessionId, id]
      )
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Error inserting vote:', err)
    res.status(500).json({ error: 'DB error' })
  }
})

// GET ranking
app.get('/api/votes/popularity', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT candidate_id, COUNT(*) as "totalVotes"
      FROM votes
      GROUP BY candidate_id
      ORDER BY "totalVotes" DESC
    `)

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'DB error' })
  }
})

// 🔥 IMPORTANTE PARA RENDER
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})