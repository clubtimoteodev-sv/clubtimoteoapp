#!/bin/bash

echo "🛑 Deteniendo frontend y backend..."
killall node >/dev/null 2>&1 || true
echo "✅ Procesos Node detenidos"
