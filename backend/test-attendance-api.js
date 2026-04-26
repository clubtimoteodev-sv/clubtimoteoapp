import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'rocafuerte006@clubtimoteo.com' }});
  
  const group = await prisma.serviceGroup.findFirst({
    where: { destacamentoId: user.destacamentoId },
    include: { members: true, attendances: true }
  });
  
  if (!group) {
    console.log("No groups found.");
    return;
  }
  
  console.log("Found group:", group.id);
  console.log("Attendances:", group.attendances);
  
  const attendanceId = group.attendances[0].id;
  
  const payload = {
    groupId: group.id,
    serviceNotes: "Testing notes PATCH",
    members: group.members.map(m => ({
      explorerId: m.explorerId,
      present: true,
      note: ""
    }))
  };
  
  console.log("Testing PATCH /api/service-attendance/" + attendanceId);
  const res = await fetch("http://localhost:4000/api/service-attendance/" + attendanceId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (await generateToken(user))
    },
    body: JSON.stringify(payload)
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

import jwt from "jsonwebtoken";
async function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, destacamentoId: user.destacamentoId },
    process.env.JWT_SECRET || "secreto_super_seguro",
    { expiresIn: "7d" }
  );
}

main().catch(console.error).finally(() => prisma.$disconnect());
