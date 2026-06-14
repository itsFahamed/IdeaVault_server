const express = require('express')
const { getDb, toObjectId } = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const db = getDb()
    const userId = req.user.id

    const commentDocs = await db
      .collection('comments')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray()

    const ideaIds = [...new Set(commentDocs.map((c) => c.idea_id))]
    const objectIds = ideaIds.map((id) => toObjectId(id)).filter(Boolean)

    const ideas = objectIds.length
      ? await db.collection('ideas').find({ _id: { $in: objectIds } }).toArray()
      : []

    const ideaMap = Object.fromEntries(ideas.map((i) => [i._id.toString(), i]))

    const interactions = commentDocs
      .map((comment) => {
        const idea = ideaMap[comment.idea_id]
        if (!idea) return null
        return {
          comment: {
            id: comment._id.toString(),
            comment_text: comment.comment_text,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
          },
          idea: {
            id: idea._id.toString(),
            title: idea.title,
            short_description: idea.short_description,
            category: idea.category,
            image_url: idea.image_url,
            author_name: idea.author_name,
          },
        }
      })
      .filter(Boolean)

    res.json({ interactions })
  } catch (err) {
    console.error('GET /api/my-interactions error', err)
    res.status(500).json({ error: 'Failed to load interactions' })
  }
})

module.exports = router
