require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MongoDB_URI
let client
let db

async function connectDb() {
  if (db) return db
  if (!uri) {
    throw new Error('MongoDB_URI is not set in .env')
  }
  client = new MongoClient(uri)
  await client.connect()
  db = client.db('ideavault')
  console.log('Connected to MongoDB (ideavault)')
  return db
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectDb() first.')
  }
  return db
}

function toObjectId(id) {
  if (!ObjectId.isValid(id)) return null
  return new ObjectId(id)
}

function formatIdea(doc, commentCount = 0) {
  if (!doc) return null
  return {
    id: doc._id.toString(),
    user_id: doc.user_id,
    author_name: doc.author_name,
    author_image: doc.author_image,
    title: doc.title,
    short_description: doc.short_description,
    detailed_description: doc.detailed_description,
    category: doc.category,
    tags: doc.tags || [],
    image_url: doc.image_url,
    estimated_budget: doc.estimated_budget,
    target_audience: doc.target_audience,
    problem_statement: doc.problem_statement,
    proposed_solution: doc.proposed_solution,
    likes: doc.likes ?? 0,
    comment_count: commentCount,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }
}

function formatComment(doc) {
  if (!doc) return null
  return {
    id: doc._id.toString(),
    idea_id: doc.idea_id,
    user_id: doc.user_id,
    user_name: doc.author_name,
    author_name: doc.author_name,
    author_image: doc.author_image,
    comment_text: doc.comment_text,
    text: doc.comment_text,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  }
}

module.exports = {
  connectDb,
  getDb,
  toObjectId,
  formatIdea,
  formatComment,
  ObjectId,
}
