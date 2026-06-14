require('dotenv').config()
const { connectDb } = require('./db')

const SAMPLE_IDEAS = [
  {
    user_id: 'seed-user-1',
    author_name: 'Sana Karim',
    author_image: 'https://i.pravatar.cc/100?u=sana',
    title: 'AI-Powered Interview Coach',
    short_description: 'A coach that prepares candidates with tailored mock interviews and real-time feedback.',
    detailed_description:
      'Job seekers struggle to practice realistic interviews without expensive coaching. This platform uses conversational AI to simulate role-specific interviews, score answers, and suggest improvements.',
    category: 'AI',
    tags: ['career', 'education', 'saas'],
    image_url: 'https://picsum.photos/seed/interviewcoach/800/500',
    estimated_budget: '$15,000 – $40,000',
    target_audience: 'Early-career professionals and bootcamp graduates',
    problem_statement: 'Candidates lack affordable, personalized interview practice.',
    proposed_solution: 'Adaptive AI mock interviews with scoring and actionable feedback.',
    likes: 124,
  },
  {
    user_id: 'seed-user-2',
    author_name: 'Marcus Patel',
    author_image: 'https://i.pravatar.cc/100?u=marcus',
    title: 'Health Reminder Wearable',
    short_description: 'A discreet wearable that schedules micro health tasks throughout the day.',
    detailed_description:
      'Chronic condition patients forget small but critical daily habits. This wearable pairs gentle haptic nudges with a companion app.',
    category: 'Health',
    tags: ['hardware', 'wellness'],
    image_url: 'https://picsum.photos/seed/healthwear/800/500',
    estimated_budget: '$80,000 – $200,000',
    target_audience: 'Adults managing hypertension and diabetes',
    problem_statement: 'Daily health routines are easy to miss without gentle reminders.',
    proposed_solution: 'Low-friction wearable nudges tied to clinician-approved plans.',
    likes: 98,
  },
  {
    user_id: 'seed-user-3',
    author_name: 'Lina Rodriguez',
    author_image: 'https://i.pravatar.cc/100?u=lina',
    title: 'EduGamify for Emerging Markets',
    short_description: 'Gamified learning paths for in-demand skills on low-bandwidth devices.',
    detailed_description:
      'Students in emerging markets need job-ready skills but face unreliable internet. EduGamify delivers bite-sized lessons offline-first.',
    category: 'Education',
    tags: ['edtech', 'mobile'],
    image_url: 'https://picsum.photos/seed/edugamify/800/500',
    estimated_budget: '$25,000 – $60,000',
    target_audience: '18–25 year olds seeking first tech roles',
    problem_statement: 'Quality skills training is inaccessible on slow connections.',
    proposed_solution: 'Offline-first gamified curriculum with verifiable credentials.',
    likes: 76,
  },
  {
    user_id: 'seed-user-4',
    author_name: 'Omar Adeyemi',
    author_image: 'https://i.pravatar.cc/100?u=omar',
    title: 'Local Services SMS Marketplace',
    short_description: 'Connects micro-entrepreneurs with local demand through SMS-first booking.',
    detailed_description:
      'Many small service providers lack smartphones or stable data. Customers text a local number to request services.',
    category: 'Commerce',
    tags: ['sms', 'marketplace'],
    image_url: 'https://picsum.photos/seed/smsmarket/800/500',
    estimated_budget: '$10,000 – $30,000',
    target_audience: 'Urban neighborhoods with high mobile money adoption',
    problem_statement: 'Informal workers miss customers who cannot find them online.',
    proposed_solution: 'SMS-based discovery and booking with escrow payments.',
    likes: 64,
  },
  {
    user_id: 'seed-user-5',
    author_name: 'Priya Menon',
    author_image: 'https://i.pravatar.cc/100?u=priya',
    title: 'SaaS Cost Optimizer',
    short_description: 'Analyze SaaS billing and recommend concrete savings for growing teams.',
    detailed_description:
      'Startups accumulate overlapping tools without visibility. This dashboard ingests invoices and usage signals.',
    category: 'Finance',
    tags: ['b2b', 'analytics'],
    image_url: 'https://picsum.photos/seed/saasopt/800/500',
    estimated_budget: '$20,000 – $50,000',
    target_audience: 'Finance ops at 20–200 person startups',
    problem_statement: 'SaaS sprawl silently drains runway.',
    proposed_solution: 'Automated spend audit with actionable recommendations.',
    likes: 52,
  },
  {
    user_id: 'seed-user-6',
    author_name: 'Ethan Clarke',
    author_image: 'https://i.pravatar.cc/100?u=ethan',
    title: 'Green Supply Chain Tracker',
    short_description: 'Trace supplier emissions and surface greener sourcing alternatives.',
    detailed_description:
      'Brands face pressure to report Scope 3 emissions but lack supplier data. This platform collects supplier disclosures.',
    category: 'Sustainability',
    tags: ['climate', 'supply-chain'],
    image_url: 'https://picsum.photos/seed/greensupply/800/500',
    estimated_budget: '$50,000 – $120,000',
    target_audience: 'Sustainability leads at consumer goods companies',
    problem_statement: 'Scope 3 reporting is fragmented and unreliable.',
    proposed_solution: 'Unified supplier emissions ledger with swap recommendations.',
    likes: 47,
  },
]

async function seed() {
  const db = await connectDb()
  const count = await db.collection('ideas').countDocuments()
  if (count > 0) {
    console.log('Ideas collection already has data — skipping seed.')
    process.exit(0)
  }

  const now = new Date()
  const docs = SAMPLE_IDEAS.map((idea, index) => ({
    ...idea,
    created_at: new Date(now.getTime() - index * 86400000),
    updated_at: new Date(now.getTime() - index * 86400000),
  }))

  await db.collection('ideas').insertMany(docs)
  console.log(`Seeded ${docs.length} sample ideas.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
