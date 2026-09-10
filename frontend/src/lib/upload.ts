import api from "./api";
import axios from "axios";

/**
 * Compresses an image in the browser via HTML5 Canvas before uploading.
 * Shrinks multi-megabyte camera photos into crisp ~100-200KB images.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            width = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
              type: "image/webp",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a file (Word documents, PDFs, JPGs, PNGs, etc.)
 * Tries S3 Presigned URL direct upload first; if AWS S3 CORS or permissions fail,
 * seamlessly falls back to backend multipart direct upload.
 */
export async function uploadFile(
  file: File,
  folder: "covers" | "notes" | "avatars" | "uploads" = "uploads"
): Promise<string> {
  // 1. Auto-compress image files on client
  const uploadReadyFile = await compressImage(file);
  const contentType = uploadReadyFile.type || "application/octet-stream";

  try {
    // 2. Request presigned URL from backend
    const presignedRes = await api.post("/api/upload/presigned-url", {
      file_name: uploadReadyFile.name,
      content_type: contentType,
      folder,
    });

    const { upload_url, public_url } = presignedRes.data;

    // 3. Direct PUT to S3
    await axios.put(upload_url, uploadReadyFile, {
      headers: {
        "Content-Type": contentType,
      },
    });

    return public_url || upload_url.split("?")[0];
  } catch (s3Error) {
    console.warn(
      "S3 Direct Upload unavailable or blocked by CORS. Falling back to backend direct upload:",
      s3Error
    );

    // 4. Fallback: upload directly to backend
    const formData = new FormData();
    formData.append("file", uploadReadyFile);
    formData.append("folder", folder);

    const directRes = await api.post("/api/upload/direct", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return directRes.data.public_url || directRes.data.url;
  }
}

