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
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

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
