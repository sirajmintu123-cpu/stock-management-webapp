const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function seedEmployee() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const userCode = "EMP001";
  const name = "Demo Employee";
  const password = "Employee@12345";

  const passwordHash = await bcrypt.hash(password, 12);

  const [existing] = await connection.execute(
    "SELECT id FROM users WHERE user_code = ? LIMIT 1",
    [userCode],
  );

  if (existing.length > 0) {
    console.log(`Employee user ${userCode} already exists.`);
    await connection.end();
    return;
  }

  await connection.execute(
    `INSERT INTO users
      (user_code, name, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userCode,
      name,
      passwordHash,
      "EMPLOYEE",
      true,
    ],
  );

  console.log("=================================");
  console.log("Employee account created successfully");
  console.log("User ID :", userCode);
  console.log("Password:", password);
  console.log("Role    : EMPLOYEE");
  console.log("=================================");

  await connection.end();
}

seedEmployee().catch((error) => {
  console.error("Failed to create employee:", error);
  process.exit(1);
});