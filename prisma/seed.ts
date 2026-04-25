import { Pool } from "pg"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BADGE_CATALOG = [
  { key: "first-concern",       label: "First Concern",       description: "Submitted your first civic concern" },
  { key: "problem-solver",      label: "Problem Solver",      description: "Had a concern reach Resolved status" },
  { key: "top-voice",           label: "Top Voice",           description: "Received 100+ upvotes on proposals or comments" },
  { key: "verified-expert",     label: "Verified Expert",     description: "Verified as an expert or professor" },
  { key: "100-day-contributor", label: "100-Day Contributor", description: "Active for 100+ days on the platform" },
  { key: "research-pioneer",    label: "Research Pioneer",    description: "Completed a research milestone" },
  { key: "assembly-regular",    label: "Assembly Regular",    description: "RSVPed to 5+ assembly events" },
  { key: "rights-champion",     label: "Rights Champion",     description: "Submitted 10+ concerns in the Rights category" },
  { key: "mob-buster",          label: "Mob Buster",          description: "Helped identify coordinated inauthentic behavior" },
]

const BANGLA_FORUM_PROPOSALS = [
  {
    id: "p-bn-001",
    title: "মিরপুর ১০ মোড়ে স্থায়ী ফুটওভার ব্রিজ উন্নয়ন",
    body: "মিরপুর ১০ এলাকায় প্রতিদিন বিপুল মানুষ রাস্তা পার হয়। বিদ্যমান ফুটওভার ব্রিজে র‌্যাম্প, ভালো আলোকসজ্জা এবং সিসিটিভি যুক্ত করলে দুর্ঘটনা কমবে এবং নারী-শিশুর নিরাপত্তা বাড়বে।",
    authorName: "সাদিয়া রহমান",
    category: "Infrastructure",
    votes: 92,
    downvotes: 4,
  },
  {
    id: "p-bn-002",
    title: "ওয়ার্ডভিত্তিক ড্রেন পরিষ্কার সময়সূচি প্রকাশ",
    body: "বর্ষায় জলাবদ্ধতা কমাতে প্রতিটি ওয়ার্ডে ড্রেন পরিষ্কারের মাসিক সময়সূচি অনলাইনে প্রকাশ করা হোক। নাগরিকরা রিপোর্ট দিলে ৪৮ ঘণ্টার মধ্যে ফলো-আপ বাধ্যতামূলক করা যেতে পারে।",
    authorName: "মাহদি ইসলাম",
    category: "Environment",
    votes: 81,
    downvotes: 3,
  },
  {
    id: "p-bn-003",
    title: "এলাকাভিত্তিক রাতের গণপরিবহন রুট চালু",
    body: "রাত ৯টার পরে কর্মজীবী মানুষ এবং শিক্ষার্থীদের জন্য নিরাপদ বাস রুট প্রয়োজন। নির্দিষ্ট স্টপেজ, জিপিএস ট্র্যাকিং এবং নারী সহায়তা হটলাইন যুক্ত করলে ভ্রমণ নিরাপদ হবে।",
    authorName: "রুবাইয়াৎ হোসেন",
    category: "Safety",
    votes: 76,
    downvotes: 5,
  },
  {
    id: "p-bn-004",
    title: "সরকারি হাসপাতালের অনলাইন সিরিয়াল ও অভিযোগ ডেস্ক",
    body: "দীর্ঘ লাইনের সমস্যা কমাতে অনলাইন সিরিয়াল ব্যবস্থা চালু করা এবং হাসপাতালভিত্তিক স্বচ্ছ অভিযোগ নিষ্পত্তি ড্যাশবোর্ড প্রকাশ করা জরুরি। এতে রোগীরা দ্রুত সেবা পাবে।",
    authorName: "ডা. তানভীর আহমেদ",
    category: "Health",
    votes: 88,
    downvotes: 6,
  },
  {
    id: "p-bn-005",
    title: "স্কুল অঞ্চলে স্পিড-কাল্মিং জোন বাধ্যতামূলক",
    body: "স্কুলের সামনে জেব্রা ক্রসিং, স্পিড ব্রেকার, সাইনেজ এবং ট্রাফিক স্বেচ্ছাসেবক নিশ্চিত করলে শিশুদের সড়ক নিরাপত্তা অনেক উন্নত হবে।",
    authorName: "নুসরাত জাহান",
    category: "Education",
    votes: 70,
    downvotes: 2,
  },
  {
    id: "p-bn-006",
    title: "বর্জ্য পৃথকীকরণে বাসাবাড়ি প্রণোদনা কর্মসূচি",
    body: "বাসাবাড়িতে প্লাস্টিক, জৈব ও সাধারণ বর্জ্য আলাদা করলে সিটি কর্পোরেশন মাসিক হোল্ডিং ট্যাক্সে ছাড় দিতে পারে। এতে পুনর্ব্যবহারযোগ্য বর্জ্যের পরিমাণ বাড়বে।",
    authorName: "ফারহান কবির",
    category: "Environment",
    votes: 84,
    downvotes: 4,
  },
  {
    id: "p-bn-007",
    title: "থানাভিত্তিক অনলাইন জিডি সহায়তা কিয়স্ক",
    body: "যাদের স্মার্টফোন বা ইন্টারনেট নেই, তাদের জন্য থানায় সহায়তা কিয়স্ক চালু করা দরকার যেখানে স্বেচ্ছাসেবকরা অনলাইন জিডি করতে সাহায্য করবেন।",
    authorName: "আলিফ হাসান",
    category: "Rights",
    votes: 66,
    downvotes: 3,
  },
  {
    id: "p-bn-008",
    title: "বাজারে নিত্যপণ্যের রিয়েল-টাইম মূল্য বোর্ড",
    body: "প্রতিটি বড় বাজারে ডিজিটাল মূল্য বোর্ড থাকলে অস্বাভাবিক মূল্যবৃদ্ধি দ্রুত শনাক্ত করা যাবে। নাগরিক অভিযোগ এলে তদারকি দল ২৪ ঘণ্টার মধ্যে ব্যবস্থা নেবে।",
    authorName: "শাহরিয়ার নাবিল",
    category: "Economy",
    votes: 73,
    downvotes: 5,
  },
  {
    id: "p-bn-009",
    title: "ওয়ার্ড পর্যায়ে নাগরিক শুনানি মাসে একবার",
    body: "মাসিক নাগরিক শুনানিতে স্থানীয় সমস্যা, বাজেট অগ্রগতি এবং চলমান প্রকল্পের আপডেট প্রকাশ করলে জনসম্পৃক্ততা বাড়বে এবং জবাবদিহি নিশ্চিত হবে।",
    authorName: "তাসনিম আরা",
    category: "Corruption",
    votes: 95,
    downvotes: 7,
  },
  {
    id: "p-bn-010",
    title: "মেট্রো স্টেশনে প্রতিবন্ধীবান্ধব প্রবেশপথ উন্নয়ন",
    body: "হুইলচেয়ার ব্যবহারকারী ও বয়স্ক নাগরিকদের জন্য প্রতিটি স্টেশনে লিফট রক্ষণাবেক্ষণ, ট্যাকটাইল পথ এবং সহায়তা ডেস্ক বাধ্যতামূলক করা প্রয়োজন।",
    authorName: "রিফাত হোসেন",
    category: "Infrastructure",
    votes: 79,
    downvotes: 2,
  },
]

const BANGLA_CONCERNS = [
  {
    id: "c-bn-101",
    title: "ধানমন্ডি ২৭ এ ভাঙা ফুটপাত দ্রুত সংস্কার প্রয়োজন",
    description: "ধানমন্ডি ২৭ নম্বর সড়কের ফুটপাত বহু জায়গায় ভাঙা। বয়স্ক ও শিশুদের চলাচলে ঝুঁকি তৈরি হচ্ছে। জরুরি ভিত্তিতে সমতল টাইলস এবং ড্রেন ঢাকনা বসানো দরকার।",
    authorName: "নাবিলা সুলতানা",
    category: "Infrastructure" as const,
    locationLat: 23.7465,
    locationLng: 90.376,
    location: "ধানমন্ডি ২৭, ঢাকা",
    upvotes: 61,
    downvotes: 2,
  },
  {
    id: "c-bn-102",
    title: "মোহাম্মদপুরে রাতের বেলা স্ট্রিটলাইট বন্ধ থাকে",
    description: "মোহাম্মদপুরের একাধিক গলিতে রাত ১০টার পর স্ট্রিটলাইট বন্ধ থাকে। এতে ছিনতাই ও দুর্ঘটনার ঝুঁকি বাড়ছে। নিয়মিত রক্ষণাবেক্ষণ টিম ও হটলাইন দরকার।",
    authorName: "তানভীর জামান",
    category: "Safety" as const,
    locationLat: 23.7573,
    locationLng: 90.3586,
    location: "মোহাম্মদপুর, ঢাকা",
    upvotes: 74,
    downvotes: 3,
  },
  {
    id: "c-bn-103",
    title: "উত্তরায় ডেঙ্গু প্রতিরোধে নিয়মিত ফগিং হচ্ছে না",
    description: "উত্তরার ৭ নম্বর সেক্টরে নির্ধারিত সময়মতো ফগিং হচ্ছে না। বাসিন্দারা বারবার অভিযোগ দিলেও সাড়া কম। ডেঙ্গু মৌসুমে সপ্তাহে অন্তত দুইবার ফগিং নিশ্চিত করা হোক।",
    authorName: "মেহজাবিন আক্তার",
    category: "Health" as const,
    locationLat: 23.8747,
    locationLng: 90.3968,
    location: "উত্তরা সেক্টর ৭, ঢাকা",
    upvotes: 83,
    downvotes: 4,
  },
  {
    id: "c-bn-104",
    title: "গুলিস্তানে পথচারী পারাপারের সিগন্যাল অকার্যকর",
    description: "গুলিস্তান জিরো পয়েন্ট এলাকায় পথচারী সিগন্যাল বেশিরভাগ সময় বন্ধ থাকে। ব্যস্ত সময়ে মানুষ জীবন ঝুঁকি নিয়ে রাস্তা পার হয়। সিগন্যাল ও ট্রাফিক পুলিশ সমন্বয় প্রয়োজন।",
    authorName: "শামীম রেজা",
    category: "Infrastructure" as const,
    locationLat: 23.7231,
    locationLng: 90.4113,
    location: "গুলিস্তান, ঢাকা",
    upvotes: 69,
    downvotes: 5,
  },
  {
    id: "c-bn-105",
    title: "শিক্ষার্থীদের জন্য নিরাপদ স্কুল বাস স্টপেজ দরকার",
    description: "মতিঝিল এলাকায় অনেক স্কুল বাস মূল সড়কে অনিরাপদভাবে থামে। নির্দিষ্ট স্টপেজ, রোড মার্কিং এবং অভিভাবক অপেক্ষা জোন তৈরি করলে শিক্ষার্থীদের নিরাপত্তা বাড়বে।",
    authorName: "রাইসা নওরীন",
    category: "Education" as const,
    locationLat: 23.731,
    locationLng: 90.4172,
    location: "মতিঝিল, ঢাকা",
    upvotes: 58,
    downvotes: 2,
  },
  {
    id: "c-bn-106",
    title: "খালপাড়ে অবৈধভাবে ময়লা ফেলা বন্ধ করা হোক",
    description: "বাড্ডা এলাকার খালপাড়ে প্রতিদিন বর্জ্য ফেলা হচ্ছে। এতে পানিদূষণ ও দুর্গন্ধ বাড়ছে। সিসিটিভি নজরদারি, জরিমানা এবং নির্দিষ্ট ডাম্পিং পয়েন্ট দরকার।",
    authorName: "মোস্তাফিজুর রহমান",
    category: "Environment" as const,
    locationLat: 23.7809,
    locationLng: 90.4262,
    location: "বাড্ডা খালপাড়, ঢাকা",
    upvotes: 77,
    downvotes: 3,
  },
  {
    id: "c-bn-107",
    title: "ওয়ার্ড অফিসে সেবার ঘুষ অভিযোগ তদন্ত প্রয়োজন",
    description: "নাগরিক সনদ ও ট্রেড লাইসেন্সের জন্য অনানুষ্ঠানিক টাকা দাবি করা হচ্ছে বলে অভিযোগ আছে। ওয়ার্ড অফিসে স্বচ্ছ টোকেন সিস্টেম এবং অভিযোগ ট্র্যাকিং চালু করা হোক।",
    authorName: "আরিফুল ইসলাম",
    category: "Corruption" as const,
    locationLat: 23.7535,
    locationLng: 90.3932,
    location: "কলাবাগান, ঢাকা",
    upvotes: 90,
    downvotes: 7,
  },
  {
    id: "c-bn-108",
    title: "প্রতিবন্ধীবান্ধব র‌্যাম্প ছাড়া সরকারি ভবনে প্রবেশ কঠিন",
    description: "বিভিন্ন সরকারি সেবা কেন্দ্রে হুইলচেয়ার র‌্যাম্প নেই বা ব্যবহার অনুপযোগী। দ্রুত মানসম্মত র‌্যাম্প, হ্যান্ডরেইল এবং সাইনেজ নিশ্চিত করতে হবে।",
    authorName: "জুনাইদ আহমেদ",
    category: "Rights" as const,
    locationLat: 23.7387,
    locationLng: 90.3956,
    location: "শেরেবাংলা নগর, ঢাকা",
    upvotes: 72,
    downvotes: 1,
  },
  {
    id: "c-bn-109",
    title: "কাঁচাবাজারে মূল্য তালিকা না থাকায় অতিরিক্ত দাম নেওয়া হয়",
    description: "ফার্মগেট কাঁচাবাজারে অধিকাংশ দোকানে মূল্য তালিকা ঝোলানো নেই। ভোক্তারা ন্যায্য দামে পণ্য পাচ্ছে না। প্রতিদিন ডিজিটাল/প্রিন্টেড মূল্য তালিকা বাধ্যতামূলক করা হোক।",
    authorName: "মাহমুদা রহমান",
    category: "Economy" as const,
    locationLat: 23.7561,
    locationLng: 90.3903,
    location: "ফার্মগেট, ঢাকা",
    upvotes: 67,
    downvotes: 4,
  },
  {
    id: "c-bn-110",
    title: "চিকিৎসা বর্জ্য সঠিকভাবে অপসারণ হচ্ছে না",
    description: "কিছু ক্লিনিকের সামনে চিকিৎসা বর্জ্য সাধারণ ডাস্টবিনে ফেলা হচ্ছে। এটি জনস্বাস্থ্যের জন্য মারাত্মক ঝুঁকি। পৃথক সংগ্রহ ও অনুমোদিত ডিসপোজাল ইউনিট বাধ্যতামূলক করা প্রয়োজন।",
    authorName: "সুমাইয়া তাবাসসুম",
    category: "Health" as const,
    locationLat: 23.7442,
    locationLng: 90.4034,
    location: "পল্টন, ঢাকা",
    upvotes: 79,
    downvotes: 3,
  },
]

async function seedBadges() {
  console.log("Seeding badge catalog...")
  for (const badge of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { name: badge.key },
      update: { description: badge.description, criteria: badge.label, iconKey: badge.key },
      create: {
        id: `badge-${badge.key}`,
        name: badge.key,
        description: badge.description,
        criteria: badge.label,
        iconKey: badge.key,
      },
    })
    console.log(`  ✓ ${badge.label}`)
  }
  console.log(`Seeded ${BADGE_CATALOG.length} badges.\n`)
}

async function seedSuperadmin() {
  const existingSuperadmin = await prisma.user.findFirst({
    where: { role: "superadmin" },
  })

  if (existingSuperadmin) {
    console.log(`Superadmin already exists: ${existingSuperadmin.email} (${existingSuperadmin.id})`)
    return
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  })

  if (!firstUser) {
    console.log("No users found. Sign up first, then re-run: npx prisma db seed")
    return
  }

  await prisma.user.update({
    where: { id: firstUser.id },
    data: { role: "superadmin" },
  })

  console.log(`Promoted "${firstUser.name}" (${firstUser.email}) to superadmin`)
}

async function seedBanglaForumProposals() {
  console.log("Seeding Bangla forum proposals...")
  for (const proposal of BANGLA_FORUM_PROPOSALS) {
    await prisma.proposal.upsert({
      where: { id: proposal.id },
      update: {
        title: proposal.title,
        body: proposal.body,
        authorName: proposal.authorName,
        category: proposal.category,
        votes: proposal.votes,
        downvotes: proposal.downvotes,
      },
      create: {
        id: proposal.id,
        title: proposal.title,
        body: proposal.body,
        authorName: proposal.authorName,
        category: proposal.category,
        votes: proposal.votes,
        downvotes: proposal.downvotes,
      },
    })
    console.log(`  ✓ ${proposal.title}`)
  }
  console.log(`Seeded ${BANGLA_FORUM_PROPOSALS.length} Bangla forum proposals.\n`)
}

async function seedBanglaConcerns() {
  console.log("Seeding Bangla concerns...")
  for (const concern of BANGLA_CONCERNS) {
    await prisma.concern.upsert({
      where: { id: concern.id },
      update: {
        title: concern.title,
        description: concern.description,
        authorName: concern.authorName,
        category: concern.category,
        locationLat: concern.locationLat,
        locationLng: concern.locationLng,
        location: concern.location,
        upvotes: concern.upvotes,
        downvotes: concern.downvotes,
      },
      create: {
        id: concern.id,
        title: concern.title,
        description: concern.description,
        authorName: concern.authorName,
        category: concern.category,
        locationLat: concern.locationLat,
        locationLng: concern.locationLng,
        location: concern.location,
        upvotes: concern.upvotes,
        downvotes: concern.downvotes,
        photos: [],
        updates: [],
      },
    })
    console.log(`  ✓ ${concern.title}`)
  }
  console.log(`Seeded ${BANGLA_CONCERNS.length} Bangla concerns.\n`)
}

async function main() {
  await seedBadges()
  await seedSuperadmin()
  await seedBanglaForumProposals()
  await seedBanglaConcerns()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
