/**
 * Cloudinary helper
 * =================
 *
 * Centralises image uploads. If Cloudinary env vars are present, images are
 * uploaded to Cloudinary and the secure CDN URL is returned. Otherwise the
 * caller should fall back to local-disk storage (dev convenience).
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary';

let configured = false;

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer - raw image bytes
 * @param {object} opts
 * @param {string} opts.folder - Cloudinary folder, e.g. 'quickcourt/avatars'
 * @param {string} [opts.publicId] - optional stable public id
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
export function uploadBufferToCloudinary(buffer, { folder, publicId } = {}) {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || 'quickcourt',
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        // Reasonable transform: cap dimensions + auto format/quality
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
