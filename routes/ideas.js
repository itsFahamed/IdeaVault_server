const express = require('express')
const { getDb, toObjectId, formatIdea } = require('../db')
const { requireAuth, optionalAuth } = require('../middleware/auth')

const router = express.Router()

async function attachCommentCounts(ideas) {
  const db = getDb()
  const counts = await db
    .collection('comments')
    .aggregate([
      { $match: { idea_id: { $in: ideas.map((i) => i.id) } } },
      { $group: { _id: '$idea_id', count: { $sum: 1 } } },
    ])
    .toArray()

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]))
  return ideas.map((idea) => ({ ...idea, comment_count: countMap[idea.id] || 0 }))
}

router.get('/trending', async (req, res) => {
  try {
    const db = getDb()
    const docs = await db.collection('ideas').find().sort({ likes: -1, created_at: -1 }).limit(6).toArray()
    let ideas = docs.map((doc) => formatIdea(doc))
    ideas = await attachCommentCounts(ideas)
    res.json({ ideas })
  } catch (err) {
    console.error('GET /api/ideas/trending error', err)
    res.status(500).json({ error: 'Failed to load trending ideas' })
  }
})

router.get('/', optionalAuth, async (req, res) => {
  try {
    const db = getDb()
    const { search, category, from, to } = req.query
    const filter = {}

    if (search && String(search).trim()) {
      filter.title = { $regex: String(search).trim(), $options: 'i' }
    }
    if (category && category !== 'All') {
      filter.category = String(category)
    }
    if (from || to) {
      filter.created_at = {}
      if (from) filter.created_at.$gte = new Date(from)
      if (to) filter.created_at.$lte = new Date(`${to}T23:59:59.999Z`)
    }

    const docs = await db.collection('ideas').find(filter).sort({ created_at: -1 }).toArray()
    let ideas = docs.map((doc) => formatIdea(doc))
    ideas = await attachCommentCounts(ideas)
    res.json({ ideas })
  } catch (err) {
    console.error('GET /api/ideas error', err)
    res.status(500).json({ error: 'Failed to load ideas' })
  }
})

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid idea id' })

    const db = getDb()
    const doc = await db.collection('ideas').findOne({ _id: objectId })
    if (!doc) return res.status(404).json({ error: 'Idea not found' })

    const ideaId = doc._id.toString()
    const commentDocs = await db.collection('comments').find({ idea_id: ideaId }).sort({ created_at: -1 }).toArray()
    const comments = commentDocs.map((c) => ({
      id: c._id.toString(),
      idea_id: c.idea_id,
      user_id: c.user_id,
      user_name: c.author_name,
      author_name: c.author_name,
      text: c.comment_text,
      comment_text: c.comment_text,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }))

    res.json({ idea: formatIdea(doc, comments.length), comments, currentUserId: req.user?.id ?? null })
  } catch (err) {
    console.error('GET /api/ideas/:id error', err)
    res.status(500).json({ error: 'Failed to load idea' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body
    if (!body.title || !body.short_description || !body.detailed_description || !body.category) {
      return res.status(400).json({ error: 'Please fill in the title, descriptions, and category.' })
    }

    const tags = Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string' && body.tags.trim()
        ? body.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

    const now = new Date()
    const doc = {
      user_id: req.user.id,
      author_name: req.user.name ?? null,
      author_image: req.user.image ?? null,
      title: String(body.title).trim(),
      short_description: String(body.short_description).trim(),
      detailed_description: String(body.detailed_description).trim(),
      category: String(body.category),
      tags,
      image_url: body.image_url || null,
      estimated_budget: body.estimated_budget || null,
      target_audience: body.target_audience || null,
      problem_statement: body.problem_statement || null,
      proposed_solution: body.proposed_solution || null,
      likes: 0,
      created_at: now,
      updated_at: now,
    }

    const db = getDb()
    const result = await db.collection('ideas').insertOne(doc)
    res.status(201).json({ idea: formatIdea({ ...doc, _id: result.insertedId }, 0) })
  } catch (err) {
    console.error('POST /api/ideas error', err)
    res.status(500).json({ error: 'Failed to create idea' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid idea id' })

    const db = getDb()
    const existing = await db.collection('ideas').findOne({ _id: objectId })
    if (!existing) return res.status(404).json({ error: 'Idea not found' })
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own ideas.' })
    }

    const allowed = ['title', 'short_description', 'detailed_description', 'category', 'image_url', 'estimated_budget', 'target_audience', 'problem_statement', 'proposed_solution']
    const updates = {}
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }
    if (req.body.tags !== undefined) {
      updates.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : typeof req.body.tags === 'string' && req.body.tags.trim()
          ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : []
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields to update' })

    updates.updated_at = new Date()
    await db.collection('ideas').updateOne({ _id: objectId }, { $set: updates })
    const updated = await db.collection('ideas').findOne({ _id: objectId })
    const commentCount = await db.collection('comments').countDocuments({ idea_id: updated._id.toString() })
    res.json({ idea: formatIdea(updated, commentCount) })
  } catch (err) {
    console.error('PUT /api/ideas/:id error', err)
    res.status(500).json({ error: 'Failed to update idea' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id)
    if (!objectId) return res.status(400).json({ error: 'Invalid idea id' })

    const db = getDb()
    const existing = await db.collection('ideas').findOne({ _id: objectId })
    if (!existing) return res.status(404).json({ error: 'Idea not found' })
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own ideas.' })
    }

    const ideaId = existing._id.toString()
    await db.collection('comments').deleteMany({ idea_id: ideaId })
    await db.collection('ideas').deleteOne({ _id: objectId })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/ideas/:id error', err)
    res.status(500).json({ error: 'Failed to delete idea' })
  }
})

module.exports = router
