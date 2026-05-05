import { Router } from "express";
import { prisma } from "../prisma.js";
import bcrypt from "bcrypt";

const router = Router();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

// Función auxiliar para editar el mensaje en Telegram
async function editTelegramMessage(messageId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        message_id: messageId,
        text: text,
        parse_mode: "Markdown"
      })
    });
  } catch (err) {
    console.error("Error editando mensaje en Telegram:", err);
  }
}

// ── GET /api/telegram/init ──────────────────────────────────────────────────
// Registra la URL actual como webhook de Telegram
router.get("/init", async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN) return res.status(400).send("Telegram no configurado");
  
  // Construir la URL pública actual (ej. https://timoteo.railway.app/api/telegram/webhook)
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers.host;
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });
    
    const data = await response.json();
    res.json({ success: true, webhookUrl, telegramResponse: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/telegram/webhook ──────────────────────────────────────────────
// Recibe los eventos desde Telegram
router.post("/webhook", async (req, res) => {
  // Telegram envía las peticiones con callback_query cuando se toca un botón
  const update = req.body;
  
  // Respondemos rápido a Telegram con 200 OK para que no reintente
  res.sendStatus(200);

  if (!update.callback_query) return;

  const callbackQuery = update.callback_query;
  const data = callbackQuery.data; // "unlock:user_id" o "reset:user_id"
  const message = callbackQuery.message;
  const chatId = message.chat.id.toString();

  // Validación de seguridad: Solo procesamos si viene del CHAT_ID del admin
  if (chatId !== TELEGRAM_CHAT_ID) {
    console.warn(`Intento de webhook desde un chat no autorizado: ${chatId}`);
    return;
  }

  // Extraer acción y user ID
  const [action, userId] = data.split(":");
  if (!userId) return;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      await editTelegramMessage(message.message_id, "❌ Error: Usuario no encontrado en la base de datos.");
      return;
    }

    if (action === "unlock") {
      // Lógica de desbloqueo simple
      await prisma.user.update({
        where: { id: userId },
        data: { isLocked: false, failedLoginAttempts: 0 }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id, // el sistema actúa sobre el usuario
          action: `Cuenta desbloqueada vía Telegram Bot`,
          endpoint: "telegram/webhook",
          method: "POST",
          payload: null
        }
      });

      const newText = `✅ *Cuenta Desbloqueada*\n\n` +
                      `El usuario ${user.name} (${user.email}) ha sido desbloqueado exitosamente.\n` +
                      `_Acción realizada vía Telegram_`;
      
      await editTelegramMessage(message.message_id, newText);

    } else if (action === "reset") {
      // Lógica de reseteo de contraseña temporal
      const tempPassword = `Timoteo${new Date().getFullYear()}!`;
      const hash = await bcrypt.hash(tempPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hash,
          mustChangePassword: true,
          failedLoginAttempts: 0,
          isLocked: false
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: `Contraseña reseteada vía Telegram Bot`,
          endpoint: "telegram/webhook",
          method: "POST",
          payload: null
        }
      });

      const newText = `🔑 *Contraseña Reseteada con Éxito*\n\n` +
                      `Se ha generado una clave temporal para *${user.name}* (${user.email}).\n\n` +
                      `👇 Copia esta contraseña temporal y inicia sesión en su cuenta:\n` +
                      `\`${tempPassword}\`\n\n` +
                      `_El sistema le exigirá cambiarla obligatoriamente al entrar._`;

      await editTelegramMessage(message.message_id, newText);
    }
  } catch (err) {
    console.error("Error procesando callback de Telegram:", err);
    await editTelegramMessage(message.message_id, "❌ Error interno al procesar la solicitud.");
  }
});

export default router;
