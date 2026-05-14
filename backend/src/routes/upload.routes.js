import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { auth } from "../middleware/auth.js";

const router = Router();
router.use(auth);

import cloudinaryPkg from "../utils/cloudinary.js";
const cloudinary = cloudinaryPkg || (await import("cloudinary")).v2;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido. Solo imágenes y PDFs."));
    }
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file" });

    // Determinar si es imagen o raw (pdf)
    const resourceType = req.file.mimetype === "application/pdf" ? "raw" : "image";

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "club-timoteo/documentos",
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error("Error al subir a Cloudinary:", error);
    res.status(500).json({ msg: "Error al subir archivo a Cloudinary" });
  }
});

// Manejador de errores de multer (tipo de archivo inválido)
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("Tipo de archivo")) {
    return res.status(400).json({ msg: err.message });
  }
  res.status(500).json({ msg: "Error al subir archivo" });
});

export default router;