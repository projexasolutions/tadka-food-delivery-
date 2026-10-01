import "dotenv/config";
import argon2 from "argon2";
import pg from "pg";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const { Client } = pg;
const rl = readline.createInterface({ input, output });

const email = (await rl.question("Admin email: ")).trim().toLowerCase();
const password = await rl.question("New admin password: ");
const fullName = (await rl.question("Admin name: ")).trim() || "Tadka Admin";
rl.close();

if (!email || !password) {
  console.error("Email and password are required.");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const result = await client.query(
    `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, 'admin')
    ON CONFLICT (email)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'admin'
    RETURNING id, email, full_name, role
    `,
    [email, passwordHash, fullName]
  );
  console.log("\nAdmin account ready:");
  console.log(result.rows[0]);
} catch (error) {
  console.error("\nFailed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
