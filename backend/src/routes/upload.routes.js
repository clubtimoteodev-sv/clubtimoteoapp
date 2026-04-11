import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

// ✅ SEGURIDAD P1: Solo se permiten imágenes — se rechazan ejecutables y otros tipos
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo se aceptan imágenes (jpg, png, webp, gif)."));
  }
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: "No file" });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Manejador de errores de multer (tipo de archivo inválido)
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Tipo de archivo")) {
    return res.status(400).json({ msg: err.message });
  }
  res.status(500).json({ msg: "Error al subir archivo" });
});

export default router;