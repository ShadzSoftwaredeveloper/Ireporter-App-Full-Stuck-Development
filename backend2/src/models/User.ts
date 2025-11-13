import pool from '../config/database';
import { User, UserRole } from '../types';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE email = ?',
      [email]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users WHERE id = ?',
      [id]
    );
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  static async create(user: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> {
    const { email, name, password, role, profilePicture } = user;
    
    const [result] = await pool.execute(
      'INSERT INTO users (email, name, password, role, profile_picture) VALUES (?, ?, ?, ?, ?)',
      [email, name, password, role || 'user', profilePicture]
    );

    const insertResult = result as any;
    return this.findById(insertResult.insertId.toString()) as Promise<User>;
  }

  static async update(id: string, updates: Partial<User>): Promise<boolean> {
    const { name, email, profilePicture } = updates;
    const [result] = await pool.execute(
      'UPDATE users SET name = ?, email = ?, profile_picture = ? WHERE id = ?',
      [name, email, profilePicture, id]
    );

    const updateResult = result as any;
    return updateResult.affectedRows > 0;
  }

  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute(
      'SELECT id, email, name, role, profile_picture, created_at FROM users ORDER BY created_at DESC'
    );
    return rows as User[];
  }

  static async delete(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    const deleteResult = result as any;
    return deleteResult.affectedRows > 0;
  }

  static async updatePassword(id: string, password: string): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [password, id]
    );
    const updateResult = result as any;
    return updateResult.affectedRows > 0;
  }
}