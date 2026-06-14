require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { connectDb } = require('./db')
const ideasRouter = require('./routes/ideas')
const commentsRouter = require('./routes/comments')
const myIdeasRouter = require('./routes/my-ideas')
const myInteractionsRouter = require('./routes/my-interactions')

const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)

// Ensure database is connected before processing requests
app.use(async (req, res, next) => {
  try {
    await connectDb()
    next()
  } catch (err) {
    console.error('Database connection middleware error:', err)
    res.status(500).json({ error: 'Database connection failed', details: err.message })
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'IdeaVault API Server is running' })
})

app.get('/api/status', async (req, res) => {
  try {
    await connectDb()
    res.json({ status: 'ok', db: true })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message })
  }
})

app.use('/api/ideas', ideasRouter)
app.use('/api/my-ideas', myIdeasRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/my-interactions', myInteractionsRouter)

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`IdeaVault_server listening on port ${port}`)
      })
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB', err)
      process.exit(1)
    })
}

module.exports = app
