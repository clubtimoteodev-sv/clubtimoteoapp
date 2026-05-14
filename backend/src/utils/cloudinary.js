/**
 * Cloudinary SDK — Configuración Central de Seguridad
 *
 * La configuración es LAZY: cloudinary.config() se ejecuta solo cuando
 * se invoca alguna función de este módulo, no al importarlo.
 * Esto permite que el servidor arranque correctamente aunque las variables
 * CLOUDINARY_* no estén configuradas aún (ej. en Railway antes de agregarlas).
 */
import { v2 as cloudinary } from "cloudinary";

/** Inicializa el SDK una sola vez; lanza un error descriptivo si faltan vars */
let _configured = false;
function ensureConfigured() {
  if (_configured) return;

  const cloudName  = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, " +
      "CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET a las variables de entorno."
    );
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  _configured = true;
}

/**
 * Sube una imagen de perfil de explorador a Cloudinary de forma segura.
 *
 * @param {Buffer} buffer        - Buffer del archivo (desde multer memoryStorage)
 * @param {string} codigoDestacamento - Código del destacamento (e.g. "DES-001")
 * @param {string} explorerId    - ID o codigoInterno del explorador (public_id base)
 * @returns {Promise<import("cloudinary").UploadApiResponse>}
 */
export async function uploadExplorerPhoto(buffer, codigoDestacamento, explorerId) {
  ensureConfigured();
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
  ensureConfigured();
  const expiresAt = Math.floor(Date.now() / 1000) + 10 * 60; // +10 minutos

  return cloudinary.utils.url(publicId, {
    type:       "authenticated",
    sign_url:   true,
    expires_at: expiresAt,
    // Entrega optimizada usando el recorte eager (500x500)
    transformation: [
      { width: 500, height: 500, crop: "fill", gravity: "face" },
      { fetch_format: "auto", quality: "auto" }
    ],
    secure: true,
  });
}

/**
 * Genera una URL firmada de miniatura (100x100) con expiración redondeada
 * a la siguiente hora. Esto permite que el navegador de los usuarios
 * guarde la foto en caché (ahorrando mucho ancho de banda de Cloudinary).
 *
 * @param {string} publicId
 * @returns {string} URL firmada para thumbnail
 */
export function generateSignedUrlThumb(publicId) {
  ensureConfigured();
  
  // Expiración estable: final de la hora actual
  const now = new Date();
  now.setMinutes(59, 59, 999);
  const expiresAt = Math.floor(now.getTime() / 1000);

  return cloudinary.utils.url(publicId, {
    type:       "authenticated",
    sign_url:   true,
    expires_at: expiresAt,
    transformation: [
      { width: 100, height: 100, crop: "fill", gravity: "face" },
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
  ensureConfigured();
  
  let cleanPublicId = publicId;
  if (cleanPublicId && cleanPublicId.match(/^v\d+\//)) {
    cleanPublicId = cleanPublicId.replace(/^v\d+\//, '');
  }

  return cloudinary.uploader.destroy(cleanPublicId, {
    type:       "authenticated",
    invalidate: true,
  });
}

export default cloudinary;
