import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const list = await prisma.explorer.findMany({
      where: { destacamento: { territorioId: "cmnewaopg0000zcpdp9hilgf3" } },
      include: { destacamento: true },
      orderBy: { createdAt: "desc" }
    });
    console.log("Success with", list.length);
  } catch(e) {
    console.error("error!!", e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
