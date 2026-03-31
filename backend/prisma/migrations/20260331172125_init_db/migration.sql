-- CreateTable
CREATE TABLE "Territorio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destacamento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "iglesia" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "encargado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "territorioId" TEXT,

    CONSTRAINT "Destacamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destacamentoId" TEXT,
    "territorioId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explorer" (
    "id" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "alergias" TEXT,
    "medicinaControlada" TEXT,
    "estudia" BOOLEAN NOT NULL,
    "nivelEducativo" TEXT,
    "nombreResponsable" TEXT NOT NULL,
    "telefonoResponsable" TEXT NOT NULL,
    "aceptoCristo" BOOLEAN NOT NULL,
    "bautizado" BOOLEAN NOT NULL,
    "asisteCelula" BOOLEAN NOT NULL,
    "nombreLiderCelula" TEXT,
    "fotoUrl" TEXT,
    "recetaUrl" TEXT,
    "permisoUrl" TEXT,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Explorer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "explorerId" TEXT NOT NULL,
    "attended" BOOLEAN NOT NULL,
    "justification" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "recipient" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceGroup" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "day" TEXT NOT NULL,
    "destacamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "explorerId" TEXT NOT NULL,

    CONSTRAINT "ServiceGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttendance" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceNotes" TEXT,

    CONSTRAINT "ServiceAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAttendanceMember" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "explorerId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "note" TEXT,

    CONSTRAINT "ServiceAttendanceMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Territorio_nombre_key" ON "Territorio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Destacamento_codigo_key" ON "Destacamento"("codigo");

-- CreateIndex
CREATE INDEX "Destacamento_territorioId_idx" ON "Destacamento"("territorioId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_destacamentoId_idx" ON "User"("destacamentoId");

-- CreateIndex
CREATE INDEX "User_territorioId_idx" ON "User"("territorioId");

-- CreateIndex
CREATE INDEX "Explorer_destacamentoId_idx" ON "Explorer"("destacamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Explorer_destacamentoId_codigoInterno_key" ON "Explorer"("destacamentoId", "codigoInterno");

-- CreateIndex
CREATE INDEX "Meeting_destacamentoId_idx" ON "Meeting"("destacamentoId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_explorerId_idx" ON "AttendanceRecord"("explorerId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_meetingId_idx" ON "AttendanceRecord"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_meetingId_explorerId_key" ON "AttendanceRecord"("meetingId", "explorerId");

-- CreateIndex
CREATE INDEX "FinanceMovement_destacamentoId_idx" ON "FinanceMovement"("destacamentoId");

-- CreateIndex
CREATE INDEX "ServiceGroup_destacamentoId_idx" ON "ServiceGroup"("destacamentoId");

-- CreateIndex
CREATE INDEX "ServiceGroupMember_explorerId_idx" ON "ServiceGroupMember"("explorerId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceGroupMember_groupId_explorerId_key" ON "ServiceGroupMember"("groupId", "explorerId");

-- CreateIndex
CREATE INDEX "ServiceAttendance_groupId_idx" ON "ServiceAttendance"("groupId");

-- CreateIndex
CREATE INDEX "ServiceAttendanceMember_explorerId_idx" ON "ServiceAttendanceMember"("explorerId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAttendanceMember_attendanceId_explorerId_key" ON "ServiceAttendanceMember"("attendanceId", "explorerId");

-- AddForeignKey
ALTER TABLE "Destacamento" ADD CONSTRAINT "Destacamento_territorioId_fkey" FOREIGN KEY ("territorioId") REFERENCES "Territorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "Destacamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_territorioId_fkey" FOREIGN KEY ("territorioId") REFERENCES "Territorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Explorer" ADD CONSTRAINT "Explorer_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "Destacamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "Destacamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_explorerId_fkey" FOREIGN KEY ("explorerId") REFERENCES "Explorer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceMovement" ADD CONSTRAINT "FinanceMovement_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "Destacamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceGroup" ADD CONSTRAINT "ServiceGroup_destacamentoId_fkey" FOREIGN KEY ("destacamentoId") REFERENCES "Destacamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceGroupMember" ADD CONSTRAINT "ServiceGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceGroupMember" ADD CONSTRAINT "ServiceGroupMember_explorerId_fkey" FOREIGN KEY ("explorerId") REFERENCES "Explorer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttendance" ADD CONSTRAINT "ServiceAttendance_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ServiceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttendanceMember" ADD CONSTRAINT "ServiceAttendanceMember_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "ServiceAttendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAttendanceMember" ADD CONSTRAINT "ServiceAttendanceMember_explorerId_fkey" FOREIGN KEY ("explorerId") REFERENCES "Explorer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
