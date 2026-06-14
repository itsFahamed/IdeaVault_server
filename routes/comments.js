const express = require('express')
const { getDb, toObjectId } = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { idea_id, comment_text } = req.body
    if (!idea_id || !comment_text || !String(comment_text).trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' })
    }

    const objectId = toObjectId(idea_id)
    if (!objectId) return res.status(400).json({ error: 'Invalid idea id' })

    const db = getDb()
    const idea = await db.collection('ideas').findOne({ _id: objectId })
    if (!idea) return res.status(404).json({ error: 'Idea not found' })

    const now = new Date()
    const doc = {
      idea_id: idea._id.toString(),
      user_id: req.user.id,
      author_name: req.user.name ?? 'User',
      author_image: req.user.image ?? null,
      comment_text: String(comment_text).trim(),
      created_at: now,
      updated_at: now,
    }

    const result = await db.collection('comments').insertOne(doc)
    res.status(201).json({
      comment: {
        id: result.insertedId.toString(),
        idea_id: doc.idea_id,
        user_id: doc.user_id,
        user_name: doc.author_name,
        author_name: doc.author_name,
        text: doc.comment_text,
        comment_text: doc.comment_text,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      },
    })
  } catch (err) {
    console.error('POST /api/comments error', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid comment id' })

    const { comment_text } = req.body
    if (!comment_text || !String(comment_text).trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' })
    }

    const db = getDb()
    const existing = await db.collection('comments').findOne({ _id: objectId })
    if (!existing) return res.status(404).json({ error: 'Comment not found' })
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments.' })
    }

    const updated_at = new Date()
    await db.collection('comments').updateOne(
      { _id: objectId },
      { $set: { comment_text: String(comment_text).trim(), updated_at } }
    )

    const updated = await db.collection('comments').findOne({ _id: objectId })
    res.json({
      comment: {
        id: updated._id.toString(),
        idea_id: updated.idea_id,
        user_id: updated.user_id,
        user_name: updated.author_name,
        author_name: updated.author_name,
        text: updated.comment_text,
        comment_text: updated.comment_text,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    })
  } catch (err) {
    console.error('PUT /api/comments/:id error', err)
    res.status(500).json({ error: 'Failed to update comment' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid comment id' })

    const db = getDb()
    const existing = await db.collection('comments').findOne({ _id: objectId })
    if (!existing) return res.status(404).json({ error: 'Comment not found' })
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments.' })
    }

    await db.collection('comments').deleteOne({ _id: objectId })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/comments/:id error', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

module.exports = router
