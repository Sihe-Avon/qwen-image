import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { nanoid } from "nanoid";

type DbUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  creditsBalance: number;
  profileCompleted: boolean; // 是否完善了资料（额外2 credits）
  registrationIp?: string;
  createdAt: number;
};

type DbGeneration = {
  id: string;
  userId: string;
  prompt: string;
  width: number;
  height: number;
  numOutputs: number;
  images: Array<{ url: string; width: number; height: number }>;
  costCredits: number;
  status: "succeeded" | "failed";
  createdAt: number;
};

type DbDailyUsage = {
  date: string; // YYYY-MM-DD
  totalFreeCreditsUsed: number;
  totalFreeCreditsValue: number; // in USD
  uniqueUsers: string[]; // user IDs
};

type DbPricingTest = {
  id: string;
  name: string; // "test_a", "test_b", "test_c"
  price: number; // 7.99, 9.99, 12.99
  credits: number; // 50, 100, 200
  isActive: boolean;
};

type DbSchema = {
  users: DbUser[];
  generations: DbGeneration[];
  dailyUsage: DbDailyUsage[];
  pricingTests: DbPricingTest[];
};

let dbPromise: Promise<Low<DbSchema>> | null = null;

export async function getDb() {
  if (dbPromise) return dbPromise;
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, "db.json");
  
  dbPromise = JSONFilePreset<DbSchema>(file, { 
    users: [], 
    generations: [], 
    dailyUsage: [],
    pricingTests: [
      { id: "test_a", name: "test_a", price: 7.99, credits: 100, isActive: true },
      { id: "test_b", name: "test_b", price: 9.99, credits: 100, isActive: true },
      { id: "test_c", name: "test_c", price: 12.99, credits: 100, isActive: true }
    ]
  }) as unknown as Promise<Low<DbSchema>>;
  
  // 确保数据库结构完整（处理现有数据库的迁移）
  const db = await dbPromise;
  let needsWrite = false;
  
  if (!db.data.dailyUsage) {
    db.data.dailyUsage = [];
    needsWrite = true;
  }
  
  if (!db.data.pricingTests) {
    db.data.pricingTests = [
      { id: "test_a", name: "test_a", price: 7.99, credits: 100, isActive: true },
      { id: "test_b", name: "test_b", price: 9.99, credits: 100, isActive: true },
      { id: "test_c", name: "test_c", price: 12.99, credits: 100, isActive: true }
    ];
    needsWrite = true;
  }
  
  if (needsWrite) {
    await db.write();
  }
  
  return db;
}

// 获取或创建 Google 用户
export async function getOrCreateGoogleUser(
  db: Low<DbSchema>, 
  googleUser: { email: string; name: string; image?: string },
  clientIp?: string
) {
  // 检查用户是否已存在
  let user = db.data.users.find(u => u.email === googleUser.email);
  
  if (!user) {
    // 新用户：给予 3 个初始 credits
    user = {
      id: nanoid(),
      email: googleUser.email,
      name: googleUser.name,
      image: googleUser.image,
      creditsBalance: 3,
      profileCompleted: false,
      registrationIp: clientIp,
      createdAt: Date.now()
    };
    db.data.users.push(user);
    await db.write();
  }
  
  return user;
}

// 完善用户资料，获得额外 2 credits
export async function completeUserProfile(db: Low<DbSchema>, userId: string) {
  const user = db.data.users.find(u => u.id === userId);
  if (user && !user.profileCompleted) {
    user.profileCompleted = true;
    user.creditsBalance += 2;
    await db.write();
  }
  return user;
}

export async function recordGeneration(
  db: Low<DbSchema>,
  userId: string,
  params: Omit<DbGeneration, "id" | "userId" | "createdAt"> & { status: DbGeneration["status"] }
) {
  const gen: DbGeneration = {
    id: nanoid(),
    userId,
    createdAt: Date.now(),
    ...params,
  };
  db.data.generations.push(gen);
  await db.write();
  return gen;
}

// 每日限额管理
const DAILY_FREE_LIMIT_USD = 20; // $20 每日免费限额
const COST_PER_CREDIT = 0.02; // $0.02 per credit (基于 FAL 成本)

export async function getTodayUsage(db: Low<DbSchema>): Promise<DbDailyUsage> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let todayUsage = db.data.dailyUsage.find(u => u.date === today);
  
  if (!todayUsage) {
    todayUsage = {
      date: today,
      totalFreeCreditsUsed: 0,
      totalFreeCreditsValue: 0,
      uniqueUsers: []
    };
    db.data.dailyUsage.push(todayUsage);
    await db.write();
  }
  
  return todayUsage;
}

export async function canUseFreeCreditToday(db: Low<DbSchema>, userId: string, creditsNeeded: number): Promise<boolean> {
  const todayUsage = await getTodayUsage(db);
  const costNeeded = creditsNeeded * COST_PER_CREDIT;
  
  // 检查是否超过每日限额
  if (todayUsage.totalFreeCreditsValue + costNeeded > DAILY_FREE_LIMIT_USD) {
    return false;
  }
  
  return true;
}

export async function recordFreeUsage(db: Low<DbSchema>, userId: string, creditsUsed: number) {
  const todayUsage = await getTodayUsage(db);
  const costUsed = creditsUsed * COST_PER_CREDIT;
  
  todayUsage.totalFreeCreditsUsed += creditsUsed;
  todayUsage.totalFreeCreditsValue += costUsed;
  
  if (!todayUsage.uniqueUsers.includes(userId)) {
    todayUsage.uniqueUsers.push(userId);
  }
  
  await db.write();
}

// A/B 测试定价获取
export async function getPricingTest(db: Low<DbSchema>, testName?: string): Promise<DbPricingTest> {
  // 确保 pricingTests 存在
  if (!db.data.pricingTests || db.data.pricingTests.length === 0) {
    // 如果没有定价测试数据，初始化默认数据
    db.data.pricingTests = [
      { id: "test_a", name: "test_a", price: 7.99, credits: 100, isActive: true },
      { id: "test_b", name: "test_b", price: 9.99, credits: 100, isActive: true },
      { id: "test_c", name: "test_c", price: 12.99, credits: 100, isActive: true }
    ];
    await db.write();
  }

  const activeTests = db.data.pricingTests.filter(t => t.isActive);
  
  if (testName) {
    const specificTest = activeTests.find(t => t.name === testName);
    if (specificTest) return specificTest;
  }
  
  // 随机选择一个活跃的测试
  const randomIndex = Math.floor(Math.random() * activeTests.length);
  return activeTests[randomIndex] || activeTests[0];
}


