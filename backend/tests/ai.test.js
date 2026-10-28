import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { AnalysisHistory } from '../src/models/AnalysisHistory.js';
import { OptimizationHistory } from '../src/models/OptimizationHistory.js';
import { ConversionHistory } from '../src/models/ConversionHistory.js';

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
});

describe('AI Engine & Analysis API Suite', () => {
  const testUser = {
    name: 'Ada Lovelace',
    username: 'adalovelace',
    email: 'ada@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const registerAndGetCookie = async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    return {
      cookie: regRes.headers['set-cookie'],
      userId: regRes.body.user.id,
    };
  };

  it('rejects unauthenticated AI requests with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/ai/review')
      .send({ language: 'python', code: 'print("hello")' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('performs static code review and records history', async () => {
    const { cookie, userId } = await registerAndGetCookie();

    const samplePython = `def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    print(total)
    return total`;

    const res = await request(app)
      .post('/api/ai/review')
      .set('Cookie', cookie)
      .send({
        language: 'python',
        code: samplePython,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis).toBeDefined();
    expect(typeof res.body.analysis.overallScore).toBe('number');
    expect(Array.isArray(res.body.analysis.issues)).toBe(true);
    expect(res.body.quota).toBeDefined();
    expect(res.body.quota.used).toBe(1);

    // Verify persisted in DB
    const saved = await AnalysisHistory.findOne({ userId });
    expect(saved).not.toBeNull();
    expect(saved.language).toBe('python');
    expect(saved.code).toBe(samplePython);
  });

  it('rejects code exceeding the 50 KB size limit with 400', async () => {
    const { cookie } = await registerAndGetCookie();

    // 52 KB string
    const largeCode = 'a'.repeat(52 * 1024);

    const res = await request(app)
      .post('/api/ai/review')
      .set('Cookie', cookie)
      .send({
        language: 'python',
        code: largeCode,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unsupported programming language', async () => {
    const { cookie } = await registerAndGetCookie();

    const res = await request(app)
      .post('/api/ai/review')
      .set('Cookie', cookie)
      .send({
        language: 'ruby',
        code: 'puts "hello"',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('performs code optimization with targetGoal and persists in DB', async () => {
    const { cookie, userId } = await registerAndGetCookie();

    const jsCode = `function findDuplicates(arr) {
  let dupes = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !dupes.includes(arr[i])) dupes.push(arr[i]);
    }
  }
  return dupes;
}`;

    const res = await request(app)
      .post('/api/ai/optimize')
      .set('Cookie', cookie)
      .send({
        language: 'javascript',
        targetGoal: 'performance',
        code: jsCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.optimization.optimizedCode).toBeDefined();
    expect(res.body.optimization.originalComplexity).toBeDefined();
    expect(res.body.optimization.optimizedComplexity).toBeDefined();

    const saved = await OptimizationHistory.findOne({ userId });
    expect(saved).not.toBeNull();
    expect(saved.language).toBe('javascript');
  });

  it('performs cross-language code conversion and validates distinct source/target', async () => {
    const { cookie, userId } = await registerAndGetCookie();

    // Rejects identical source and target
    const invalidRes = await request(app)
      .post('/api/ai/convert')
      .set('Cookie', cookie)
      .send({
        sourceLanguage: 'python',
        targetLanguage: 'python',
        code: 'x = 1',
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');

    // Valid conversion
    const res = await request(app)
      .post('/api/ai/convert')
      .set('Cookie', cookie)
      .send({
        sourceLanguage: 'python',
        targetLanguage: 'javascript',
        code: 'def add(a, b):\n    return a + b',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversion.convertedCode).toBeDefined();
    expect(res.body.conversion.targetLanguage).toBe('javascript');

    const saved = await ConversionHistory.findOne({ userId });
    expect(saved).not.toBeNull();
    expect(saved.sourceLanguage).toBe('python');
    expect(saved.targetLanguage).toBe('javascript');
  });

  it('retrieves accurate daily quota for user', async () => {
    const { cookie } = await registerAndGetCookie();

    // Perform one review
    await request(app)
      .post('/api/ai/review')
      .set('Cookie', cookie)
      .send({ language: 'javascript', code: 'const x = 1;' });

    const quotaRes = await request(app)
      .get('/api/ai/quota')
      .set('Cookie', cookie);

    expect(quotaRes.status).toBe(200);
    expect(quotaRes.body.quota.used).toBe(1);
    expect(quotaRes.body.quota.limit).toBe(50);
    expect(quotaRes.body.quota.remaining).toBe(49);
  });
});
