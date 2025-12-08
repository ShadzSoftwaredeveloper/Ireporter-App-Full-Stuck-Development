import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { UserRole } from '../types';

// Use the `Secret` type from jsonwebtoken so TypeScript picks the correct overload
const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret) || 'your_fallback_secret';

export class AuthUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId: string, role: UserRole): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  static verifyToken(token: string): { userId: string; role: UserRole } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}