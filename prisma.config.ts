import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be configured before running Prisma commands. Set it in .env.local or your environment.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: databaseUrl },
});