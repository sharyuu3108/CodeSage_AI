import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
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
  await CodeSession.deleteMany({});
});

describe('Code Sessions & History API Suite', () => {
  const user1 = {
    name: 'Linus Torvalds',
    username: 'linust',
    email: 'linus@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  const user2 = {
    name: 'Ken Thompson',
    username: 'kent',
    email: 'ken@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  it('performs CRUD on code sessions with strict owner isolation', async () => {
    // 1. Register User 1 and User 2
    const reg1 = await request(app).post('/api/auth/register').send(user1);
    const cookie1 = reg1.headers['set-cookie'];

    const reg2 = await request(app).post('/api/auth/register').send(user2);
    const cookie2 = reg2.headers['set-cookie'];

    // 2. Create session for User 1
    const createRes = await request(app)
      .post('/api/sessions')
      .set('Cookie', cookie1)
      .send({
        title: 'Linux Kernel Loop',
        language: 'cpp',
        code: 'int main() { return 0; }',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.session.title).toBe('Linux Kernel Loop');
    const sessionId = createRes.body.session.id;

    // 3. User 1 can retrieve session
    const getRes = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie1);

    expect(getRes.status).toBe(200);
    expect(getRes.body.session.title).toBe('Linux Kernel Loop');

    // 4. User 2 CANNOT retrieve User 1 session (strictly returns 404)
    const unauthorizedGet = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie2);

    expect(unauthorizedGet.status).toBe(404);

    // 5. User 1 can update session
    const updateRes = await request(app)
      .put(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie1)
      .send({
        title: 'Updated Kernel Routine',
        code: 'int main() { return 42; }',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.session.title).toBe('Updated Kernel Routine');

    // 6. User 2 CANNOT update User 1 session
    const unauthorizedUpdate = await request(app)
      .put(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie2)
      .send({ title: 'Hacked Title' });

    expect(unauthorizedUpdate.status).toBe(404);

    // 7. User 1 can list their sessions
    const listRes = await request(app)
      .get('/api/sessions')
      .set('Cookie', cookie1);

    expect(listRes.status).toBe(200);
    expect(listRes.body.sessions.length).toBe(1);

    // User 2 lists their sessions (should be 0)
    const listRes2 = await request(app)
      .get('/api/sessions')
      .set('Cookie', cookie2);

    expect(listRes2.body.sessions.length).toBe(0);

    // 8. User 1 deletes session
    const deleteRes = await request(app)
      .delete(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie1);

    expect(deleteRes.status).toBe(200);

    // 9. Session is now gone
    const verifyGone = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .set('Cookie', cookie1);

    expect(verifyGone.status).toBe(404);
  });
});
