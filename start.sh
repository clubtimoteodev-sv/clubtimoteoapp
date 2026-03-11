#!/bin/bash

echo "🚀 Iniciando Club Exploradores..."

echo ""
echo "📦 Instalando dependencias frontend..."
npm install

echo ""
echo "📦 Instalando dependencias backend..."
cd backend
npm install

echo ""
echo "🧠 Generando Prisma client..."
npx prisma generate

echo ""
echo "🌐 Iniciando backend..."
npm run dev &

echo ""
echo "🎨 Iniciando frontend..."
cd ..
npm run dev &

echo ""
echo "✅ Proyecto iniciado"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:4000"