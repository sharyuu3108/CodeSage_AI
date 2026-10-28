import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { AnalysisHistory } from '../src/models/AnalysisHistory.js';
import { OptimizationHistory } from '../src/models/OptimizationHistory.js';
import { ConversionHistory } from '../src/models/ConversionHistory.js';
import { CodeSession } from '../src/models/CodeSession.js';

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long_for_security';
  process.env.JWT_EXPIRES_IN = '7d';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDB(uri);
}, 300000);

afterAll(async () => {
  await disconnectDB();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await AnalysisHistory.deleteMany({});
  await OptimizationHistory.deleteMany({});
  await ConversionHistory.deleteMany({});
  await CodeSession.deleteMany({});
});

describe('Profile & Developer Statistics Suite', () => {
  const userA = {
    name: 'Alan Turing',
    username: 'alanturing',
    email: 'alan@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const userB = {
    name: 'Grace Hopper',
    username: 'gracehopper',
    email: 'grace@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  it('rejects unauthenticated GET /api/profile with 401', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('calculates real developer statistics accurately from MongoDB records for authenticated user', async () => {
    // 1. Register User A
    const regRes = await request(app).post('/api/auth/register').send(userA);
    const cookieA = regRes.headers['set-cookie'];
    const userIdA = regRes.body.user.id;

    // 2. Insert mock DB records for User A
    await AnalysisHistory.create([
      { userId: userIdA, language: 'python', code: 'print("review 1")', analysis: { summary: 'ok' } },
      { userId: userIdA, language: 'python', code: 'print("review 2")', analysis: { summary: 'ok' } },
    ]);
    await OptimizationHistory.create({
      userId: userIdA,
      language: 'python',
      originalCode: 'orig',
      optimizedCode: 'opt',
    });
    await ConversionHistory.create([
      { userId: userIdA, sourceLanguage: 'python', targetLanguage: 'java', sourceCode: 's1', convertedCode: 'c1' },
      { userId: userIdA, sourceLanguage: 'python', targetLanguage: 'cpp', sourceCode: 's2', convertedCode: 'c2' },
      { userId: userIdA, sourceLanguage: 'java', targetLanguage: 'javascript', sourceCode: 's3', convertedCode: 'c3' },
    ]);
    await CodeSession.create({
      userId: userIdA,
      title: 'Euler 1',
      language: 'python',
      code: 'print(42)',
    });

    // 3. Fetch Profile for User A
    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', cookieA);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.username).toBe('alanturing');
    expect(res.body.profile.stats).toEqual({
      totalReviews: 2,
      totalOptimizations: 1,
      totalConversions: 3,
      totalSavedSessions: 1,
    });
  });

  it('strictly isolates statistics so User B cannot see User A records (Section 13)', async () => {
    // Register User A and create records
    const regA = await request(app).post('/api/auth/register').send(userA);
    const userIdA = regA.body.user.id;

    await AnalysisHistory.create({
      userId: userIdA,
      language: 'python',
      code: 'code',
      analysis: { summary: 'private to A' },
    });

    // Register User B
    const regB = await request(app).post('/api/auth/register').send(userB);
    const cookieB = regB.headers['set-cookie'];

    // User B requests their profile
    const resB = await request(app)
      .get('/api/profile')
      .set('Cookie', cookieB);

    expect(resB.status).toBe(200);
    expect(resB.body.profile.username).toBe('gracehopper');
    // User B's stats must be completely 0
    expect(resB.body.profile.stats).toEqual({
      totalReviews: 0,
      totalOptimizations: 0,
      totalConversions: 0,
      totalSavedSessions: 0,
    });
  });

  it('updates profile via PUT /api/profile and rejects mass assignment attempts', async () => {
    const reg = await request(app).post('/api/auth/register').send(userA);
    const cookie = reg.headers['set-cookie'];

    // Valid update
    const updateRes = await request(app)
      .put('/api/profile')
      .set('Cookie', cookie)
      .send({
        name: 'Alan Mathison Turing',
        bio: 'Father of modern computer science and artificial intelligence',
        skills: ['Cryptography', 'Computability', 'Logic'],
        defaultLanguage: 'python',
        preferredLanguages: ['python', 'cpp'],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user.name).toBe('Alan Mathison Turing');
    expect(updateRes.body.user.bio).toContain('Father of modern computer science');
    expect(updateRes.body.user.skills).toEqual(['Cryptography', 'Computability', 'Logic']);

    // Mass assignment attempt
    const hackRes = await request(app)
      .put('/api/profile')
      .set('Cookie', cookie)
      .send({
        role: 'superuser',
        isAdmin: true,
      });

    expect(hackRes.status).toBe(400);
    expect(hackRes.body.error.code).toBe('VALIDATION_ERROR');
  });
});
