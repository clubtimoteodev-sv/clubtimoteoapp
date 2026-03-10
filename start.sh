#!/bin/bash

set -e

PROJECT_DIR="$HOME/Dev/ClubTimoteo/x"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"
BACKEND_URL="http://localhost:4000/api/health"
FRONTEND_URL="http://localhost:5173"

echo "🚀 Iniciando Club Explorers App..."

if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ No existe la carpeta del proyecto: $PROJECT_DIR"
  exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ No existe la carpeta backend: $BACKEND_DIR"
  exit 1
fi

echo "📦 Verificando PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
  echo "🔄 PostgreSQL estaba apagado. Encendiendo..."
  sudo systemctl start postgresql
else
  echo "✅ PostgreSQL ya está encendido"
fi

echo "📁 Verificando dependencias del backend..."
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "⬇️ Instalando dependencias del backend..."
  (cd "$BACKEND_DIR" && npm install)
else
  echo "✅ Backend OK"
fi

echo "📁 Verificando dependencias del frontend..."
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "⬇️ Instalando dependencias del frontend..."
  (cd "$FRONTEND_DIR" && npm install)
else
  echo "✅ Frontend OK"
fi

echo "🛑 Cerrando procesos viejos de Node..."
killall node >/dev/null 2>&1 || true

echo "🧠 Iniciando backend..."
gnome-terminal -- bash -c "cd '$BACKEND_DIR' && npm run dev; exec bash"

sleep 4

echo "🌐 Iniciando frontend..."
gnome-terminal -- bash -c "cd '$FRONTEND_DIR' && npm run dev; exec bash"

sleep 5

echo "🔎 Verificando backend..."
if curl -s "$BACKEND_URL" >/dev/null; then
  echo "✅ Backend responde bien"
else
  echo "⚠️ Backend aún no responde. Revisa la terminal del backend."
fi

echo "🖥️ Abriendo navegador..."
xdg-open "$FRONTEND_URL" >/dev/null 2>&1 || true

echo "✅ Todo iniciado"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  http://localhost:4000"
