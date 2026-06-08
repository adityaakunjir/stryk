import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL!;

// Decode the password from the URL string to fix "password must be a string" error in pg-pool
let parsedConnectionString = connectionString;
try {
  // Extract password from postgresql://user:password@host
  const url = new URL(connectionString);
  if (url.password) {
    url.password = decodeURIComponent(url.password);
    parsedConnectionString = url.toString();
  }
} catch (e) {
  // ignore
}

const pool = new Pool({
  connectionString: parsedConnectionString,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}