import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });
}

// Lazy proxy — defers PrismaClient construction until first property access,
// so module import never touches the DB or env. Critical for Next.js build
// "page data collection" phase which imports every route's module.
let _prisma = globalForPrisma.prisma;
export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!_prisma) {
        _prisma = createPrismaClient();
        if (process.env.NODE_ENV !== "production") {
          globalForPrisma.prisma = _prisma;
        }
      }
      const value = _prisma[prop];
      return typeof value === "function" ? value.bind(_prisma) : value;
    },
  }
);

export default prisma;
