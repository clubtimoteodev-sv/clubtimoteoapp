import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando la creación de datos...");

  // La contraseña para todos los usuarios será: exploradores123
  const passwordHash = await bcrypt.hash('exploradores123', 10);

  // 1. DESTACAMENTO CHALCHUAPA
  await prisma.destacamento.create({
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
          { codigoInterno: '003', nombre: 'Diego', apellidos: 'López', fechaNacimiento: new Date('2015-11-02'), direccion: 'Residencial Los Pinos', telefono: '7345-6789', estudia: true, nombreResponsable: 'Ana López', telefonoResponsable: '7345-6780', aceptoCristo: false, bautizado: false, asisteCelula: false },
          { codigoInterno: '004', nombre: 'Valentina', apellidos: 'Hernández', fechaNacimiento: new Date('2012-02-18'), direccion: 'Caserío San Juan', telefono: '7456-7890', estudia: true, nombreResponsable: 'Carlos Hernández', telefonoResponsable: '7456-7891', aceptoCristo: true, bautizado: true, asisteCelula: true },
          { codigoInterno: '005', nombre: 'Sebastián', apellidos: 'Pérez', fechaNacimiento: new Date('2016-09-30'), direccion: 'Cantón Las Cruces', telefono: '7567-8901', estudia: true, nombreResponsable: 'Laura Pérez', telefonoResponsable: '7567-8902', aceptoCristo: true, bautizado: false, asisteCelula: true },
        ]
      }
    }
  });

  // 2. DESTACAMENTO SANTA ANA
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
          { codigoInterno: '003', nombre: 'Daniela', apellidos: 'Reyes', fechaNacimiento: new Date('2015-07-08'), direccion: 'Barrio San Miguelito', telefono: '7890-1234', estudia: true, nombreResponsable: 'Miguel Reyes', telefonoResponsable: '7890-1235', aceptoCristo: false, bautizado: false, asisteCelula: false },
          { codigoInterno: '004', nombre: 'Alejandro', apellidos: 'Mendoza', fechaNacimiento: new Date('2012-10-15'), direccion: 'Urbanización El Trébol', telefono: '7901-2345', estudia: true, nombreResponsable: 'Rosa Mendoza', telefonoResponsable: '7901-2346', aceptoCristo: true, bautizado: true, asisteCelula: true },
          { codigoInterno: '005', nombre: 'Valeria', apellidos: 'Ortiz', fechaNacimiento: new Date('2016-12-05'), direccion: 'Colonia IVU', telefono: '7012-3456', estudia: true, nombreResponsable: 'Luis Ortiz', telefonoResponsable: '7012-3457', aceptoCristo: true, bautizado: false, asisteCelula: true },
        ]
      }
    }
  });

  // 3. DESTACAMENTO SAN SALVADOR
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
          { codigoInterno: '002', nombre: 'Isabella', apellidos: 'Morales', fechaNacimiento: new Date('2014-06-14'), direccion: 'San Benito', telefono: '7234-8888', estudia: true, nombreResponsable: 'Carmen Morales', telefonoResponsable: '7234-8887', aceptoCristo: true, bautizado: false, asisteCelula: true },
          { codigoInterno: '003', nombre: 'Joaquín', apellidos: 'Romero', fechaNacimiento: new Date('2015-09-09'), direccion: 'Colonia Miramonte', telefono: '7345-7777', estudia: true, nombreResponsable: 'Jorge Romero', telefonoResponsable: '7345-7776', aceptoCristo: false, bautizado: false, asisteCelula: false },
          { codigoInterno: '004', nombre: 'Mariana', apellidos: 'Aguilar', fechaNacimiento: new Date('2012-11-28'), direccion: 'Ciudad Merliot', telefono: '7456-6666', estudia: true, nombreResponsable: 'Silvia Aguilar', telefonoResponsable: '7456-6665', aceptoCristo: true, bautizado: true, asisteCelula: true },
          { codigoInterno: '005', nombre: 'Emilio', apellidos: 'Navarro', fechaNacimiento: new Date('2016-01-17'), direccion: 'Antiguo Cuscatlán', telefono: '7567-5555', estudia: true, nombreResponsable: 'Fernando Navarro', telefonoResponsable: '7567-5554', aceptoCristo: true, bautizado: false, asisteCelula: true },
        ]
      }
    }
  });

  console.log("¡Los 3 destacamentos, usuarios y exploradores fueron creados con éxito!");
}

main()
  .catch((e) => {
    console.error("Error al poblar la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });