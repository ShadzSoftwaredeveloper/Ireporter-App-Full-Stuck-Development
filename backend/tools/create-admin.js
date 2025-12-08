#!/usr/bin/env node
const dotenv = require('dotenv');
dotenv.config();

const usersDal = require('../repositories/users');

const [, , email, password, nameArg] = process.argv;

if (!email || !password) {
  console.error('Usage: node tools/create-admin.js <email> <password> [name]');
  process.exit(1);
}

const name = nameArg || 'Administrator';

(async () => {
  try {
    const user = await usersDal.create({ email, password, name, role: 'admin' });
    console.log('✅ Admin user created:');
    console.log(`  id: ${user.id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  name: ${user.name}`);
    console.log(`  role: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create admin user');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();
