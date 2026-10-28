import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

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
});

describe('Authentication API Suite', () => {
  const validUser = {
    name: 'Ada Lovelace',
    username: 'adalovelace',
    email: 'ada@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    it('successfully registers a new user, hashes password, and sets HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Ada Lovelace');
      expect(res.body.user.username).toBe('adalovelace');
      expect(res.body.user.email).toBe('ada@example.com');
      // Password or hash must NEVER be returned
      expect(res.body.user.password).toBeUndefined();

      // Check HTTP-only cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('token=') && c.includes('HttpOnly'))).toBe(true);

      // Verify user saved in DB with hashed password
      const dbUser = await User.findOne({ email: 'ada@example.com' }).select('+password');
      expect(dbUser).toBeDefined();
      expect(dbUser.password).not.toBe('Password123!');
      expect(dbUser.password.startsWith('$2a$12$') || dbUser.password.startsWith('$2b$12$')).toBe(true);
    });

    it('rejects duplicate email with 409 Conflict', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          username: 'differentuser',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('rejects duplicate username with 409 Conflict', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'different@example.com',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects weak password missing uppercase or numbers', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: 'weakpassword',
          confirmPassword: 'weakpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects password confirmation mismatch', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          confirmPassword: 'MismatchPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in successfully using email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'ada@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('ada@example.com');
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.includes('token=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('logs in successfully using username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'adalovelace',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('adalovelace');
    });

    it('returns generic error on wrong password without leaking account existence', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'ada@example.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email/username or password.');
    });

    it('returns identical generic error when user does not exist (timing attack dummy hash)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistentuser@example.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email/username or password.');
    });

    it('rejects NoSQL injection operator in login body (Section 42 Item 6)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: { $ne: null },
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me & Session Protection', () => {
    it('returns 401 when accessed without token cookie', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when token is tampered/invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['token=invalid_forged_token_value']);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('returns 200 with authenticated user data when valid token cookie is provided', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(validUser);
      const authCookie = registerRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('adalovelace');
      expect(res.body.user.password).toBeUndefined();
    });
  });

  describe('PUT /api/auth/profile & Mass Assignment Protection (Section 42 Item 8)', () => {
    it('updates allowed profile fields successfully', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Cookie', cookie)
        .send({
          bio: 'First computer programmer',
          location: 'London, UK',
          skills: ['Algorithms', 'Analytical Engine'],
          defaultLanguage: 'python',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.bio).toBe('First computer programmer');
      expect(res.body.user.location).toBe('London, UK');
      expect(res.body.user.skills).toEqual(['Algorithms', 'Analytical Engine']);
    });

    it('strictly rejects mass-assignment attempts containing unauthorized fields like role or email', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Cookie', cookie)
        .send({
          bio: 'Trying to escalate privileges',
          role: 'admin',
          isAdmin: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');

      // Verify user was NOT altered
      const user = await User.findOne({ username: 'adalovelace' });
      expect(user.role).toBeUndefined();
      expect(user.isAdmin).toBeUndefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('rejects incorrect current password', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'BrandNewPassword456!',
          confirmNewPassword: 'BrandNewPassword456!',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('changes password successfully and allows login with new password', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookie)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'BrandNewPassword456!',
          confirmNewPassword: 'BrandNewPassword456!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Old password must fail
      const failLogin = await request(app).post('/api/auth/login').send({
        identifier: 'ada@example.com',
        password: 'Password123!',
      });
      expect(failLogin.status).toBe(401);

      // New password must succeed
      const successLogin = await request(app).post('/api/auth/login').send({
        identifier: 'ada@example.com',
        password: 'BrandNewPassword456!',
      });
      expect(successLogin.status).toBe(200);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the auth cookie on logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // Cleared cookie has empty token or expired date
      expect(cookies.some((c) => c.includes('token=;') || c.includes('Expires='))).toBe(true);
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('deletes account when confirmed with valid password', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const cookie = reg.headers['set-cookie'];

      const res = await request(app)
        .delete('/api/auth/account')
        .set('Cookie', cookie)
        .send({
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // User must be gone from DB
      const dbUser = await User.findOne({ username: 'adalovelace' });
      expect(dbUser).toBeNull();

      // Subsequent login must fail
      const loginRes = await request(app).post('/api/auth/login').send({
        identifier: 'ada@example.com',
        password: 'Password123!',
      });
      expect(loginRes.status).toBe(401);
    });
  });
});
