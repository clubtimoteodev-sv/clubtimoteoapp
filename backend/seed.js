import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando el sembrado de la base de datos...");

  // 1. Crear los 3 territorios
  const territoriosNombres = ["Occidente", "Centro", "Oriente"];
  const territorios = {};

  for (const nombre of territoriosNombres) {
    territorios[nombre] = await prisma.territorio.upsert({
      where: { nombre: nombre },
      update: {}, 
      create: { nombre: nombre, descripcion: `Zona ${nombre}` },
    });
  }
  const occidenteId = territorios["Occidente"].id;
  console.log("✅ Territorios creados.");

  // 2. Lista de destacamentos con su prefijo de correo personalizado
  const destacamentosOccidente = [
    { codigo: "001", nombre: "Leones", ciudad: "Los Naranjos", correo: "LosNaranjos001" },
    { codigo: "002", nombre: "Alfa", ciudad: "San José La Majada", correo: "Alfa002" },
    { codigo: "004", nombre: "Hormigas", ciudad: "Zonsacate", correo: "Hormigas004" },
    { codigo: "005", nombre: "Panteras", ciudad: "Cara Sucia", correo: "Panteras005" },
    { codigo: "006", nombre: "Roca Fuerte", ciudad: "Chalchuapa", correo: "RocaFuerte006" },
    { codigo: "010", nombre: "Linces", ciudad: "La Hachadura", correo: "Linces010" },
    { codigo: "012", nombre: "Gedeón", ciudad: "Cuisnahuat", correo: "Gedeon012" }, 
    { codigo: "015", nombre: "Sinaí", ciudad: "Santa Ana", correo: "Sinai015" },
    { codigo: "999", nombre: "Águilas", ciudad: "Izalco", correo: "Aguilas999" },
    { codigo: "998", nombre: "Guibbor", ciudad: "Los Apantes", correo: "Guibbor998" }
  ];

  // Contraseña por defecto para todos
  const hashPassword = await bcrypt.hash("123456", 10); 

  // 3. Insertamos los destacamentos y creamos a sus líderes
  for (const dest of destacamentosOccidente) {
    const nuevoDestacamento = await prisma.destacamento.upsert({
      where: { codigo: dest.codigo },
      update: { territorioId: occidenteId, nombre: dest.nombre, ciudad: dest.ciudad },
      create: {
        codigo: dest.codigo,
        nombre: dest.nombre,
        ciudad: dest.ciudad,
        territorioId: occidenteId
      }
    });

    const emailOficial = `${dest.correo}@clubtimoteo.com`;
    
    await prisma.user.upsert({
      where: { email: emailOficial },
      update: {},
      create: {
        name: `Líder ${dest.nombre}`,
        email: emailOficial,
        password: hashPassword,
        role: "Lider Destacamento",
        destacamentoId: nuevoDestacamento.id
      }
    });

    console.log(`🏕️  Listo: ${dest.nombre} | Correo: ${emailOficial}`);
  }

  // 4. Crear al Líder Territorial de Occidente
  await prisma.user.upsert({
    where: { email: "occidente@clubtimoteo.com" },
    update: {},
    create: {
      name: "Supervisor Occidente",
      email: "occidente@clubtimoteo.com",
      password: hashPassword,
      role: "lider territorial",
      territorioId: occidenteId
    }
  });
  console.log("👑 Líder Territorial de Occidente creado.");

  console.log("🎉 ¡Base de datos sembrada con éxito!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });