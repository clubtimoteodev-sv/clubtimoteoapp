/**
 * Cloudinary SDK — Configuración Central de Seguridad
 *
 * Responsabilidades:
 *  - Inicializar el SDK con credenciales del entorno
 *  - Proveer helpers para subida segura y generación de Signed URLs
 *  - Garantizar type:"authenticated", strip_metadata y eager 500x500
 */
import { v2 as cloudinary } from "cloudinary";
import { mustEnv } from "./env.js";

cloudinary.config({
  cloud_name: mustEnv("CLOUDINARY_CLOUD_NAME"),
  api_key:    mustEnv("CLOUDINARY_API_KEY"),
  api_secret: mustEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

/**
 * Sube una imagen de perfil de explorador a Cloudinary de forma segura.
 *
 * @param {Buffer} buffer        - Buffer del archivo (desde multer memoryStorage)
 * @param {string} codigoDestacamento - Código del destacamento (e.g. "DES-001")
 * @param {string} explorerId    - ID o codigoInterno del explorador (public_id base)
 * @returns {Promise<import("cloudinary").UploadApiResponse>}
 */
export async function uploadExplorerPhoto(buffer, codigoDestacamento, explorerId) {
  // Construimos el public_id determinístico para evitar duplicados:
  // club-timoteo/destacamentos/{codigo}/perfiles/{explorerId}
  const publicId = `club-timoteo/destacamentos/${codigoDestacamento}/perfiles/${explorerId}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id:      publicId,
        type:           "authenticated",   // NUNCA pública
        overwrite:      true,
        invalidate:     true,              // Limpia CDN cache al reemplazar
        resource_type:  "image",
        // Eliminar metadatos EXIF/GPS del dispositivo
        image_metadata: false,             // strip_metadata equivalente v2 SDK
        // Transformación eager al subir: 500×500 centrado en rostro
        eager: [
          {
            width:   500,
            height:  500,
            crop:    "fill",
            gravity: "face",
            quality: "auto",
            fetch_format: "auto",
          }
        ],
        eager_async: false, // Esperar a que la transformación esté lista
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Genera una URL firmada con expiración de 10 minutos para una imagen autenticada.
 * Incluye optimización f_auto + q_auto.
 *
 * @param {string} publicId - El public_id completo en Cloudinary
 * @returns {string} URL firmada y temporal
 */
export function generateSignedUrl(publicId) {
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60; // +10 minutos

  return cloudinary.utils.url(publicId, {
    type:       "authenticated",
    sign_url:   true,
    expires_at: expiresAt,
    // Entrega optimizada para todos los navegadores
    transformation: [
      { fetch_format: "auto", quality: "auto" }
    ],
    secure: true,
  });
}

/**
 * Elimina una imagen de Cloudinary (para limpieza al reemplazar).
 * @param {string} publicId
 */
export async function deleteExplorerPhoto(publicId) {
  return cloudinary.uploader.destroy(publicId, {
    type:       "authenticated",
    invalidate: true,
  });
}

export default cloudinary;
