import { getPrisma } from "../src/lib/prisma";

const prisma = getPrisma();

try {
  const [result] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM barangay.services
  `;

  console.log(`Read ${result.count.toString()} rows from barangay.services.`);
} finally {
  await prisma.$disconnect();
}