import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Configura aquí el correo y contraseña que desees para el Super Admin
  const email = "adonayflores006002@clubtimoteo.com";
  const rawPassword = "K4i2er2026CT";
  
  console.log("Conectando a la base de datos...");
  const exists = await prisma.user.findUnique({ where: { email } });

  if (exists) {
    console.log(`⚠️ El usuario ${email} ya existe en la base de datos.`);
    return;
  }

  console.log("Generando hash de la contraseña segura...");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.create({
    data: {
      name: "Super Admin Maestro",
      email: email,
      password: hashedPassword,
      role: "superadmin", // <--- Este rol es el que te da acceso al panel maestro
    }
  });

  console.log("✅ SUPER ADMIN CREADO EXITOSAMENTE");
  console.log("-----------------------------------------");
  console.log(`Usuario: ${email}`);
  console.log(`Clave:   ${rawPassword}`);
  console.log("-----------------------------------------");
  console.log("Ya puedes iniciar sesión en producción.");
}

main()
  .catch(e => console.error("Error al crear usuario:", e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
