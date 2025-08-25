import { sql } from '@vercel/postgres';
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { nanoid } from "nanoid";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  creditsBalance: number;
  profileCompleted: boolean;
  registrationIp?: string;
  createdAt: number;
};

export type DbGeneration = {
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

// 判断是否在生产环境
const isProduction = process.env.VERCEL && process.env.POSTGRES_URL;

// 生产环境：使用 Postgres
export async function initDatabase() {
  if (!isProduction) return;
  
  try {
    // 创建用户表
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        credits_balance INTEGER DEFAULT 5,
        profile_completed BOOLEAN DEFAULT FALSE,
        registration_ip TEXT,
        created_at BIGINT NOT NULL
      )
    `;

    // 创建生成记录表
    await sql`
      CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        num_outputs INTEGER NOT NULL,
        images JSONB NOT NULL,
        cost_credits INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// 获取或创建用户
export async function getOrCreateUser(
  email: string,
  name: string,
  image?: string,
  clientIp?: string
): Promise<DbUser> {
  if (isProduction) {
    // 生产环境：使用 Postgres
    try {
      // 先查找用户
      const result = await sql`
        SELECT id, email, name, image, credits_balance, profile_completed, registration_ip, created_at
        FROM users 
        WHERE email = ${email}
      `;

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          image: row.image,
          creditsBalance: row.credits_balance,
          profileCompleted: row.profile_completed,
          registrationIp: row.registration_ip,
          createdAt: row.created_at,
        };
      }

      // 创建新用户
      const userId = nanoid();
      const createdAt = Date.now();
      
      await sql`
        INSERT INTO users (id, email, name, image, credits_balance, profile_completed, registration_ip, created_at)
        VALUES (${userId}, ${email}, ${name}, ${image || null}, 5, FALSE, ${clientIp || null}, ${createdAt})
      `;

      return {
        id: userId,
        email,
        name,
        image,
        creditsBalance: 5,
        profileCompleted: false,
        registrationIp: clientIp,
        createdAt,
      };
    } catch (error) {
      console.error('Postgres user operation error:', error);
      throw error;
    }
  } else {
    // 本地开发：使用 lowdb
    const db = await getLocalDb();
    let user = db.data.users.find(u => u.email === email);
    
    if (!user) {
      user = {
        id: nanoid(),
        email,
        name,
        image,
        creditsBalance: 5,
        profileCompleted: false,
        registrationIp: clientIp,
        createdAt: Date.now()
      };
      db.data.users.push(user);
      await db.write();
    }
    
    return user;
  }
}

// 更新用户credits
export async function updateUserCredits(email: string, newBalance: number): Promise<void> {
  if (isProduction) {
    await sql`
      UPDATE users 
      SET credits_balance = ${newBalance}
      WHERE email = ${email}
    `;
  } else {
    const db = await getLocalDb();
    const user = db.data.users.find(u => u.email === email);
    if (user) {
      user.creditsBalance = newBalance;
      await db.write();
    }
  }
}

// 获取用户信息
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  if (isProduction) {
    const result = await sql`
      SELECT id, email, name, image, credits_balance, profile_completed, registration_ip, created_at
      FROM users 
      WHERE email = ${email}
    `;

    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      creditsBalance: row.credits_balance,
      profileCompleted: row.profile_completed,
      registrationIp: row.registration_ip,
      createdAt: row.created_at,
    };
  } else {
    const db = await getLocalDb();
    return db.data.users.find(u => u.email === email) || null;
  }
}

// 记录生成
export async function recordGeneration(generation: DbGeneration): Promise<void> {
  if (isProduction) {
    await sql`
      INSERT INTO generations (id, user_id, prompt, width, height, num_outputs, images, cost_credits, status, created_at)
      VALUES (${generation.id}, ${generation.userId}, ${generation.prompt}, ${generation.width}, ${generation.height}, ${generation.numOutputs}, ${JSON.stringify(generation.images)}, ${generation.costCredits}, ${generation.status}, ${generation.createdAt})
    `;
  } else {
    const db = await getLocalDb();
    db.data.generations.push(generation);
    await db.write();
  }
}

// 获取用户的生成记录
export async function getUserGenerations(userId: string): Promise<DbGeneration[]> {
  if (isProduction) {
    const result = await sql`
      SELECT id, user_id, prompt, width, height, num_outputs, images, cost_credits, status, created_at
      FROM generations 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      prompt: row.prompt,
      width: row.width,
      height: row.height,
      numOutputs: row.num_outputs,
      images: JSON.parse(row.images),
      costCredits: row.cost_credits,
      status: row.status,
      createdAt: row.created_at,
    }));
  } else {
    const db = await getLocalDb();
    return db.data.generations
      .filter(g => g.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
  }
}

// 本地数据库（开发环境）
type LocalDbSchema = {
  users: DbUser[];
  generations: DbGeneration[];
};

let localDbPromise: Promise<Low<LocalDbSchema>> | null = null;

async function getLocalDb() {
  if (localDbPromise) return localDbPromise;
  
  const dir = join(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, "db.json");
  
  localDbPromise = JSONFilePreset<LocalDbSchema>(file, { 
    users: [], 
    generations: []
  }) as unknown as Promise<Low<LocalDbSchema>>;
  
  return localDbPromise;
}
