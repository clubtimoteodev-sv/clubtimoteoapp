import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando el sembrado de la base de datos...");

  // 1. Crear los 3 territorios principales
  // Usamos upsert para no duplicar si vuelves a correr el script
  const territoriosNombres = ["Occidente", "Centro", "Oriente"];
  const territoriosMap = {};

  for (const nombre of territoriosNombres) {
    const t = await prisma.territorio.upsert({
      where: { nombre: nombre },
      update: {}, 
      create: { 
        nombre: nombre, 
        descripcion: `Jurisdicción Territorial ${nombre}` 
      },
    });
    territoriosMap[nombre] = t.id; // Guardamos el CUID generado
  }
  
  const occidenteId = territoriosMap["Occidente"];
  console.log("✅ Territorios creados y mapeados.");

  // 2. Lista de destacamentos de Occidente
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

  // Contraseña por defecto: 123456
  const hashPassword = await bcrypt.hash("123456", 10); 

  // 3. Insertar Destacamentos y sus respectivos Líderes
  for (const dest of destacamentosOccidente) {
    // Primero el Destacamento (conectado al territorio)
    const nuevoDest = await prisma.destacamento.upsert({
      where: { codigo: dest.codigo },
      update: { 
        territorioId: occidenteId, 
        nombre: dest.nombre, 
        ciudad: dest.ciudad 
      },
      create: {
        codigo: dest.codigo,
        nombre: dest.nombre,
        ciudad: dest.ciudad,
        territorioId: occidenteId // Conexión por ID
      }
    });

    const emailLider = `${dest.correo}@clubtimoteo.com`.toLowerCase();
    
    // Luego el Usuario Líder (conectado al destacamento)
    await prisma.user.upsert({
      where: { email: emailLider },
      update: { password: hashPassword }, // Por si quieres resetear claves masivamente
      create: {
        name: `Líder ${dest.nombre}`,
        email: emailLider,
        password: hashPassword,
        role: "lider_destacamento", // Minúsculas y guion bajo (estándar de ingeniería)
        destacamentoId: nuevoDest.id
      }
    });

    console.log(`🏕️  Sincronizado: ${dest.nombre} (Cod: ${dest.codigo})`);
  }

  // 4. Crear al Líder Territorial de Occidente (Supervisor)
  // Este no tiene destacamentoId, solo territorioId
  await prisma.user.upsert({
    where: { email: "occidente@clubtimoteo.com" },
    update: { password: hashPassword },
    create: {
      name: "Supervisor Territorial Occidente",
      email: "occidente@clubtimoteo.com",
      password: hashPassword,
      role: "lider_territorial",
      territorioId: occidenteId
    }
  });

  console.log("👑 Líder Territorial de Occidente creado correctamente.");
  console.log("🎉 ¡Base de datos sembrada con éxito!");
}
// --- NUEVO: Datos de prueba para Exploradores y Asistencias ---
  console.log("👦 Creando exploradores y reuniones de prueba...");

  // Obtenemos todos los destacamentos que acabamos de crear
  const todosLosDestacamentos = await prisma.destacamento.findMany();

  for (const dest of todosLosDestacamentos) {
    // 1. Crear 5 Exploradores por destacamento
    for (let i = 1; i <= 5; i++) {
      const explorer = await prisma.explorer.upsert({
        where: {
          destacamentoId_codigoInterno: {
            destacamentoId: dest.id,
            codigoInterno: `EXP-${i}`
          }
        },
        update: {},
        create: {
          codigoInterno: `EXP-${i}`,
          nombre: `Explorador ${i}`,
          apellidos: `Apellido ${dest.nombre}`,
          fechaNacimiento: new Date(2015, 0, 1),
          direccion: `Colonia Central, ${dest.ciudad}`,
          telefono: "7000-0000",
          estudia: true,
          nombreResponsable: "Padre de Familia",
          telefonoResponsable: "7000-0001",
          aceptoCristo: true,
          bautizado: false,
          asisteCelula: true,
          destacamentoId: dest.id
        }
      });

      // 2. Crear una Reunión y marcar Asistencia para este explorador
      const reunion = await prisma.meeting.create({
        data: {
          date: new Date(),
          type: "Regular",
          destacamentoId: dest.id
        }
      });

      await prisma.attendanceRecord.create({
        data: {
          meetingId: reunion.id,
          explorerId: explorer.id,
          attended: Math.random() > 0.3, // 70% de probabilidad de que asistiera
          justification: ""
        }
      });
    }
    console.log(`✅ Datos de prueba listos para: ${dest.nombre}`);
  }

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });