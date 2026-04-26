import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'rocafuerte006@clubtimoteo.com' }});
  console.log("User destacamentoId:", user?.destacamentoId);
  
  const group = await prisma.serviceGroup.findFirst({
    where: { destacamentoId: user?.destacamentoId },
    include: { members: true, attendanceRecords: true }
  });
  console.log("Group:", JSON.stringify(group, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
