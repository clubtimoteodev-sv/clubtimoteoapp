import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- Utilidades para generar datos aleatorios (Nombres, Teléfonos y Reuniones) ---
const nombresHombres = ["Carlos", "José", "Juan", "Luis", "Miguel", "Javier", "Francisco", "Mario", "Antonio", "Pedro", "Diego", "Alejandro", "Kevin", "Jonathan", "Cristian"];
const nombresMujeres = ["Ana", "María", "Carmen", "Laura", "Marta", "Fátima", "Beatriz", "Gabriela", "Verónica", "Patricia", "Andrea", "Daniela", "Sofia", "Valeria"];
const apellidos = ["Pérez", "Rodríguez", "García", "Martínez", "López", "González", "Hernández", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Reyes", "Morales", "Ramos", "Mendoza", "Aguilar", "Mejía", "Rivas", "Portillo"];

function getRandomName() {
  const isMale = Math.random() > 0.5;
  const firstName = isMale ? nombresHombres[Math.floor(Math.random() * nombresHombres.length)] : nombresMujeres[Math.floor(Math.random() * nombresMujeres.length)];
  const lastName1 = apellidos[Math.floor(Math.random() * apellidos.length)];
  const lastName2 = apellidos[Math.floor(Math.random() * apellidos.length)];
  return { nombre: firstName, apellidos: `${lastName1} ${lastName2}` };
}

function generatePhoneSV() {
  const prefix = Math.random() > 0.5 ? '7' : '6';
  const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${part1}-${part2}`;
}

// CORRECCIÓN: Se quitaron las anotaciones ": Date"
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generador de tipos de reuniones
function getRandomMeetingType() {
  // 5% de probabilidad de que sea un Campamento Local
  if (Math.random() < 0.05) {
    return "Campamento Local";
  }
  
  const tiposComunes = [
    "Reunión General",
    "Culto de Timoteos",
    "Reunión de Amiguitos de Jesús (0 a 10 años)",
    "Seguidores del Maestro (11 a 15 años)",
    "Servicio Cristiano (16 en adelante)"
  ];
  
  return tiposComunes[Math.floor(Math.random() * tiposComunes.length)];
}

async function main() {
  console.log("🧹 Limpiando la base de datos anterior...");

  // Borrar en cascada inversa para limpiar la BD antes de sembrar
  await prisma.serviceAttendanceMember.deleteMany();
  await prisma.serviceAttendance.deleteMany();
  await prisma.serviceGroupMember.deleteMany();
  await prisma.serviceGroup.deleteMany();
  await prisma.financeMovement.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.meetingDeletionLog.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.explorer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.destacamento.deleteMany();
  await prisma.territorio.deleteMany();

  console.log("✨ Base de datos limpia. 🌱 Iniciando el sembrado...");

  // 1. Crear los 3 territorios principales
  const territoriosNombres = ["Occidente", "Centro", "Oriente"];
  // CORRECCIÓN: Se quitó la anotación de tipo "Record<string, string>"
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
    territoriosMap[nombre] = t.id; 
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

  const hashPassword = await bcrypt.hash("123456", 10);

  // 3. Insertar Destacamentos y sus respectivos Líderes
  for (const dest of destacamentosOccidente) {
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
        territorioId: occidenteId
      }
    });

    const emailLider = `${dest.correo}@clubtimoteo.com`.toLowerCase();

    await prisma.user.upsert({
      where: { email: emailLider },
      update: { password: hashPassword },
      create: {
        name: `Líder ${dest.nombre}`,
        email: emailLider,
        password: hashPassword,
        role: "lider_destacamento",
        destacamentoId: nuevoDest.id
      }
    });

    console.log(`🏕️  Sincronizado: ${dest.nombre} (Cod: ${dest.codigo})`);
  }

  // 4. Crear al Líder Territorial de Occidente
  await prisma.user.upsert({
    where: { email: "occidente@clubtimoteo.com" },
    update: { password: hashPassword },
    create: {
      name: "Lider Territorial Occidente",
      email: "occidente@clubtimoteo.com",
      password: hashPassword,
      role: "lider_territorial",
      territorioId: occidenteId
    }
  });
  console.log("👑 Líder Territorial de Occidente creado correctamente.");

  // --- Exploradores Aleatorios y Reuniones Históricas ---
  console.log("\n👦 Generando exploradores aleatorios y simulando historial de reuniones...");

  const todosLosDestacamentos = await prisma.destacamento.findMany();

  for (const dest of todosLosDestacamentos) {
    const cantExploradores = Math.floor(Math.random() * 101); 
    const exploradoresDelDestacamento = [];

    for (let i = 1; i <= cantExploradores; i++) {
      const datosNombre = getRandomName();
      const codigoPadding = String(i).padStart(3, '0');

      const explorer = await prisma.explorer.upsert({
        where: {
          destacamentoId_codigoInterno: {
            destacamentoId: dest.id,
            codigoInterno: codigoPadding
          }
        },
        update: {},
        create: {
          codigoInterno: codigoPadding,
          nombre: datosNombre.nombre,
          apellidos: datosNombre.apellidos,
          fechaNacimiento: getRandomDate(new Date(2005, 0, 1), new Date(2018, 0, 1)),
          direccion: `Colonia/Cantón conocido en ${dest.ciudad || 'El Salvador'}`,
          telefono: generatePhoneSV(),
          estudia: true,
          nombreResponsable: getRandomName().nombre + " " + datosNombre.apellidos.split(" ")[0],
          telefonoResponsable: generatePhoneSV(),
          aceptoCristo: Math.random() > 0.5,
          bautizado: Math.random() > 0.7,
          asisteCelula: Math.random() > 0.4,
          destacamentoId: dest.id
        }
      });
      exploradoresDelDestacamento.push(explorer);
    }

    console.log(`   ➔ ${dest.nombre}: ${cantExploradores} exploradores generados.`);

    // --- REUNIONES ---
    
    // 1. Reuniones pasadas (hace 2-6 meses) SIN asistencia registrada
    for(let m = 0; m < 3; m++) {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - Math.floor(Math.random() * 5 + 2)); 
      await prisma.meeting.create({
        data: {
          date: pastDate,
          type: getRandomMeetingType(),
          destacamentoId: dest.id
        }
      });
    }

    // 2. Reuniones del MES ACTUAL (unas con asistencia, otras sin)
    for(let m = 0; m < 4; m++) {
      const currDate = new Date();
      currDate.setDate(currDate.getDate() - Math.floor(Math.random() * 20));
      
      const meeting = await prisma.meeting.create({
        data: {
          date: currDate,
          type: getRandomMeetingType(),
          destacamentoId: dest.id
        }
      });

      const seTomoAsistencia = Math.random() > 0.4; 

      if (seTomoAsistencia && exploradoresDelDestacamento.length > 0) {
        const registros = exploradoresDelDestacamento.map(exp => ({
          meetingId: meeting.id,
          explorerId: exp.id,
          attended: Math.random() > 0.25, 
          justification: ""
        }));

        await prisma.attendanceRecord.createMany({
          data: registros
        });
      }
    }
  }

  console.log("\n🎉 ¡Base de datos sembrada con éxito con datos realistas y dinámicos!");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });