import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  barangayPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.barangayPrisma) {
    return globalForPrisma.barangayPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be configured before accessing PostgreSQL.");
  }
  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL connection string; NEXT_PUBLIC_SUPABASE_URL is only the REST API URL.",
    );
  }

  const adapter = new PrismaPg({ connectionString }, { schema: "barangay" });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.barangayPrisma = client;
  }

  return client;
}