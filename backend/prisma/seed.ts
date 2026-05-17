import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await prisma.officer.upsert({
    where: { badgeNumber: "ADMIN-001" },
    update: { passwordHash, role: "ADMIN", active: true },
    create: {
      badgeNumber: "ADMIN-001",
      passwordHash,
      role: "ADMIN"
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
