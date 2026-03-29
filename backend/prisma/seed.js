import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando la creación de datos masiva...");

  // Limpiar base de datos (opcional, cuidado en producción)
  // await prisma.attendanceRecord.deleteMany({});
  // await prisma.financeMovement.deleteMany({});
  // await prisma.meeting.deleteMany({});

  const passwordHash = await bcrypt.hash('exploradores123', 10);

  // --- 1. IGLESIA CHALCHUAPA ---
  const d1 = await prisma.destacamento.create({
    data: {
      codigo: '001',
      nombre: 'Destacamento Panteras',
      ciudad: 'Chalchuapa',
      users: {
        create: {
          name: 'Admin Chalchuapa',
          email: 'admin1@iglesia.com',
          password: passwordHash,
          role: 'admin'
        }
      },
      explorers: {
        create: [
          { codigoInterno: '001', nombre: 'Mateo', apellidos: 'García', fechaNacimiento: new Date('2013-05-14'), direccion: 'Barrio El Centro', telefono: '7123-4567', estudia: true, nombreResponsable: 'María García', telefonoResponsable: '7123-4568', aceptoCristo: true, bautizado: true, asisteCelula: true },
          { codigoInterno: '002', nombre: 'Sofía', apellidos: 'Martínez', fechaNacimiento: new Date('2014-08-20'), direccion: 'Colonia Buena Vista', telefono: '7234-5678', estudia: true, nombreResponsable: 'Juan Martínez', telefonoResponsable: '7234-5679', aceptoCristo: true, bautizado: false, asisteCelula: true },
        ]
      },
      // DATOS DE FINANZAS
      financeMovements: {
        create: [
          { type: 'entrada', amount: 50.00, category: 'Donación', description: 'Ofrenda dominical', date: new Date(), recipient: 'Iglesia Central' },
          { type: 'salida', amount: 15.25, category: 'Materiales', description: 'Compra de cuerdas', date: new Date(), recipient: 'Ferretería local' },
        ]
      },
      // REUNIONES Y ASISTENCIA
      meetings: {
        create: [
          { 
            date: new Date('2026-03-20T14:00:00Z'), 
            type: 'Reunión General'
          }
        ]
      }
    },
    include: { explorers: true, meetings: true }
  });

  // Crear registros de asistencia para la reunión de Chalchuapa
  await prisma.attendanceRecord.create({
    data: {
      meetingId: d1.meetings[0].id,
      explorerId: d1.explorers[0].id,
      attended: true
    }
  });

  // --- 2. IGLESIA SANTA ANA ---
  await prisma.destacamento.create({
    data: {
      codigo: '002',
      nombre: 'Destacamento Roca Fuerte',
      ciudad: 'Santa Ana',
      users: {
        create: {
          name: 'Admin Santa Ana',
          email: 'admin2@iglesia.com',
          password: passwordHash,
          role: 'admin'
        }
      },
      explorers: {
        create: [
          { codigoInterno: '001', nombre: 'Camila', apellidos: 'Rivera', fechaNacimiento: new Date('2013-01-10'), direccion: 'Colonia El Palmar', telefono: '7678-9012', estudia: true, nombreResponsable: 'José Rivera', telefonoResponsable: '7678-9013', aceptoCristo: true, bautizado: true, asisteCelula: true },
          { codigoInterno: '002', nombre: 'Gabriel', apellidos: 'Cruz', fechaNacimiento: new Date('2014-04-25'), direccion: 'Residencial Santa Lucía', telefono: '7789-0123', estudia: true, nombreResponsable: 'Elena Cruz', telefonoResponsable: '7789-0124', aceptoCristo: true, bautizado: false, asisteCelula: true },
        ]
      },
      financeMovements: {
        create: [
          { type: 'entrada', amount: 100.00, category: 'Evento', description: 'Inscripción Campamento', date: new Date(), recipient: 'Tesorero' },
        ]
      }
    }
  });

  // --- 3. IGLESIA SAN SALVADOR ---
  await prisma.destacamento.create({
    data: {
      codigo: '003',
      nombre: 'Destacamento Naranjos',
      ciudad: 'San Salvador',
      users: {
        create: {
          name: 'Admin San Salvador',
          email: 'admin3@iglesia.com',
          password: passwordHash,
          role: 'admin'
        }
      },
      explorers: {
        create: [
          { codigoInterno: '001', nombre: 'Lucas', apellidos: 'Castro', fechaNacimiento: new Date('2013-03-22'), direccion: 'Colonia Escalón', telefono: '7123-9999', estudia: true, nombreResponsable: 'Roberto Castro', telefonoResponsable: '7123-9998', aceptoCristo: true, bautizado: true, asisteCelula: true },
        ]
      }
    }
  });

  console.log("✅ ¡Base de datos poblada con éxito para las 3 iglesias!");
}

main()
  .catch((e) => {
    console.error("❌ Error al poblar la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });