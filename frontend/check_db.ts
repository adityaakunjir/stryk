import { config } from "dotenv";
config({ path: ".env" });
import { prisma } from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, fullName: true, position: true, playStyle: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
