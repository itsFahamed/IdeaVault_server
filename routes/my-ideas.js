const express = require('express')
const { getDb, formatIdea } = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDb()
    const docs = await db.collection('ideas').find({ user_id: req.user.id }).sort({ created_at: -1 }).toArray()

    const ideas = docs.map((doc) => formatIdea(doc))
    const counts = await db
      .collection('comments')
      .aggregate([
        { $match: { idea_id: { $in: ideas.map((i) => i.id) } } },
        { $group: { _id: '$idea_id', count: { $sum: 1 } } },
      ])
      .toArray()

    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]))
    res.json({
      ideas: ideas.map((idea) => ({ ...idea, comment_count: countMap[idea.id] || 0 })),
    })
  } catch (err) {
    console.error('GET /api/my-ideas error', err)
    res.status(500).json({ error: 'Failed to load your ideas' })
  }
})

module.exports = router
