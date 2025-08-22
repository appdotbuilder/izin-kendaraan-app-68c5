import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type UserRole } from '../schema';
import { login, verifyToken } from '../handlers/auth';
import { eq } from 'drizzle-orm';
import { createHash, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-key';

// Helper function to hash passwords consistently
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

// Helper function to create JWT tokens for testing
const createTestJWT = (payload: any, secret: string, expiresIn: number): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const exp = now + expiresIn;
  
  const jwtPayload = { ...payload, iat: now, exp };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  
  const signature = createHash('sha256')
    .update(`${encodedHeader}.${encodedPayload}`)
    .update(secret)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Helper function to decode JWT payload
const decodeJWT = (token: string): any => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    return null;
  }
};

// Test data
const testUserData = {
  nik: '1234567890',
  password: 'test123',
  name: 'Test User',
  role: 'Karyawan' as UserRole,
  fcm_token: null
};

const testLoginInput: LoginInput = {
  nik: '1234567890',
  password: 'test123'
};

const testLoginInputWithFCM: LoginInput = {
  nik: '1234567890',
  password: 'test123',
  fcm_token: 'fcm-token-123'
};

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Create test user with hashed password
      const hashedPassword = hashPassword(testUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const createdUser = result[0];

      // Test login
      const loginResult = await login(testLoginInput);

      // Verify response structure
      expect(loginResult.user.id).toEqual(createdUser.id);
      expect(loginResult.user.nik).toEqual(testUserData.nik);
      expect(loginResult.user.name).toEqual(testUserData.name);
      expect(loginResult.user.role).toEqual(testUserData.role);
      expect(loginResult.user.fcm_token).toBeNull();
      expect(loginResult.user.created_at).toBeInstanceOf(Date);
      expect(loginResult.token).toBeDefined();
      expect(typeof loginResult.token).toBe('string');

      // Verify JWT token is valid
      const decoded = decodeJWT(loginResult.token);
      expect(decoded).not.toBeNull();
      expect(decoded.userId).toEqual(createdUser.id);
      expect(decoded.nik).toEqual(testUserData.nik);
      expect(decoded.role).toEqual(testUserData.role);
      expect(decoded.exp).toBeGreaterThan(Date.now());
    });

    it('should update FCM token when provided', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const createdUser = result[0];

      // Login with FCM token
      const loginResult = await login(testLoginInputWithFCM);

      // Verify FCM token in response
      expect(loginResult.user.fcm_token).toEqual('fcm-token-123');

      // Verify FCM token updated in database
      const updatedUsers = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, createdUser.id))
        .execute();

      expect(updatedUsers[0].fcm_token).toEqual('fcm-token-123');
    });

    it('should reject login with invalid NIK', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .execute();

      // Try login with invalid NIK
      const invalidInput: LoginInput = {
        nik: 'invalid-nik',
        password: 'test123'
      };

      await expect(login(invalidInput)).rejects.toThrow(/invalid credentials/i);
    });

    it('should reject login with invalid password', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .execute();

      // Try login with invalid password
      const invalidInput: LoginInput = {
        nik: '1234567890',
        password: 'wrong-password'
      };

      await expect(login(invalidInput)).rejects.toThrow(/invalid credentials/i);
    });

    it('should work with different user roles', async () => {
      // Create HR user
      const hrUserData = {
        ...testUserData,
        nik: '9876543210',
        role: 'HR' as UserRole,
        name: 'HR User'
      };

      const hashedPassword = hashPassword(hrUserData.password);
      await db.insert(usersTable)
        .values({
          ...hrUserData,
          password: hashedPassword
        })
        .execute();

      // Login as HR user
      const hrLoginInput: LoginInput = {
        nik: '9876543210',
        password: 'test123'
      };

      const loginResult = await login(hrLoginInput);

      expect(loginResult.user.role).toEqual('HR');
      expect(loginResult.user.name).toEqual('HR User');

      // Verify JWT contains correct role
      const decoded = decodeJWT(loginResult.token);
      expect(decoded.role).toEqual('HR');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const createdUser = result[0];

      // Generate valid token
      const token = createTestJWT(
        { userId: createdUser.id, nik: createdUser.nik, role: createdUser.role },
        JWT_SECRET,
        24 * 60 * 60 * 1000 // 24 hours
      );

      // Verify token
      const verifyResult = await verifyToken(token);

      expect(verifyResult).not.toBeNull();
      expect(verifyResult!.userId).toEqual(createdUser.id);
      expect(verifyResult!.role).toEqual(testUserData.role);
    });

    it('should reject invalid JWT token', async () => {
      const invalidToken = 'invalid-jwt-token';

      const verifyResult = await verifyToken(invalidToken);

      expect(verifyResult).toBeNull();
    });

    it('should reject expired JWT token', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const createdUser = result[0];

      // Generate expired token
      const expiredToken = createTestJWT(
        { userId: createdUser.id, nik: createdUser.nik, role: createdUser.role },
        JWT_SECRET,
        -1000 // Expired 1 second ago
      );

      const verifyResult = await verifyToken(expiredToken);

      expect(verifyResult).toBeNull();
    });

    it('should reject token for non-existent user', async () => {
      // Generate token for non-existent user ID
      const token = createTestJWT(
        { userId: 99999, nik: 'fake-nik', role: 'Karyawan' },
        JWT_SECRET,
        24 * 60 * 60 * 1000
      );

      const verifyResult = await verifyToken(token);

      expect(verifyResult).toBeNull();
    });

    it('should handle malformed JWT payload', async () => {
      // Generate token with missing required fields
      const incompleteToken = createTestJWT(
        { nik: 'some-nik' }, // Missing userId and role
        JWT_SECRET,
        24 * 60 * 60 * 1000
      );

      const verifyResult = await verifyToken(incompleteToken);

      expect(verifyResult).toBeNull();
    });

    it('should verify token for different user roles', async () => {
      // Create Admin user
      const adminUserData = {
        ...testUserData,
        nik: 'admin123',
        role: 'Admin' as UserRole,
        name: 'Admin User'
      };

      const hashedPassword = hashPassword(adminUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...adminUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const adminUser = result[0];

      // Generate token for Admin
      const token = createTestJWT(
        { userId: adminUser.id, nik: adminUser.nik, role: adminUser.role },
        JWT_SECRET,
        24 * 60 * 60 * 1000
      );

      const verifyResult = await verifyToken(token);

      expect(verifyResult).not.toBeNull();
      expect(verifyResult!.userId).toEqual(adminUser.id);
      expect(verifyResult!.role).toEqual('Admin');
    });

    it('should handle tampered JWT tokens', async () => {
      // Create test user
      const hashedPassword = hashPassword(testUserData.password);
      const result = await db.insert(usersTable)
        .values({
          ...testUserData,
          password: hashedPassword
        })
        .returning()
        .execute();

      const createdUser = result[0];

      // Generate valid token
      const validToken = createTestJWT(
        { userId: createdUser.id, nik: createdUser.nik, role: createdUser.role },
        JWT_SECRET,
        24 * 60 * 60 * 1000
      );

      // Tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

      const verifyResult = await verifyToken(tamperedToken);

      expect(verifyResult).toBeNull();
    });
  });
});