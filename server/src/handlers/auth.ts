import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type LoginResponse } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret-key';
const JWT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Simple JWT implementation using Node.js crypto
const createJWT = (payload: any, secret: string, expiresIn: number): string => {
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

const verifyJWT = (token: string, secret: string): any => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  
  const [encodedHeader, encodedPayload, signature] = parts;
  
  // Verify signature
  const expectedSignature = createHash('sha256')
    .update(`${encodedHeader}.${encodedPayload}`)
    .update(secret)
    .digest('base64url');
  
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid signature');
  }
  
  // Decode payload
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
  
  // Check expiration
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Token expired');
  }
  
  return payload;
};

// Simple password hashing using PBKDF2
const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const actualSalt = salt || randomBytes(32).toString('hex');
  const hash = createHash('pbkdf2')
    .update(password + actualSalt)
    .digest('hex');
  
  return { hash, salt: actualSalt };
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  // For simplicity, we'll use a basic comparison
  // In production, you'd want to use proper PBKDF2 with salt
  const hash = createHash('sha256').update(password).digest('hex');
  return timingSafeEqual(Buffer.from(hash), Buffer.from(hashedPassword));
};

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by NIK
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.nik, input.nik))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password - simple hash comparison for demo
    const inputPasswordHash = createHash('sha256').update(input.password).digest('hex');
    if (!timingSafeEqual(Buffer.from(inputPasswordHash), Buffer.from(user.password))) {
      throw new Error('Invalid credentials');
    }

    // Update FCM token if provided
    if (input.fcm_token) {
      await db.update(usersTable)
        .set({ fcm_token: input.fcm_token })
        .where(eq(usersTable.id, user.id))
        .execute();
      
      // Update user object with new FCM token
      user.fcm_token = input.fcm_token;
    }

    // Generate JWT token
    const token = createJWT(
      { userId: user.id, nik: user.nik, role: user.role },
      JWT_SECRET,
      JWT_EXPIRES_IN
    );

    // Return user data without password and with token
    return {
      user: {
        id: user.id,
        nik: user.nik,
        name: user.name,
        role: user.role,
        fcm_token: user.fcm_token,
        created_at: user.created_at
      },
      token
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const verifyToken = async (token: string): Promise<{ userId: number; role: string } | null> => {
  try {
    // Verify JWT token
    const decoded = verifyJWT(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId || !decoded.role) {
      return null;
    }

    // Optional: Verify user still exists in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, decoded.userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    return {
      userId: decoded.userId,
      role: decoded.role
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};