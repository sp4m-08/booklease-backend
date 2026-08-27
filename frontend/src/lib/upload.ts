import api from "./api";
import axios from "axios";

/**
 * Uploads a file (Word documents, PDFs, JPGs, PNGs, etc.)
 * Tries S3 Presigned URL direct upload first; if AWS S3 CORS or permissions fail,
 * seamlessly falls back to backend multipart direct upload.
 */
export async function uploadFile(
  file: File,
  folder: "covers" | "notes" | "avatars" | "uploads" = "uploads"
): Promise<string> {
  const contentType = file.type || "application/octet-stream";

  try {
    // 1. Request presigned URL from backend
    const presignedRes = await api.post("/api/upload/presigned-url", {
      file_name: file.name,
      content_type: contentType,
      folder,
    });

    const { upload_url, public_url } = presignedRes.data;

    // 2. Direct PUT to S3
    await axios.put(upload_url, file, {
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

    // 3. Fallback: upload directly to backend
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const directRes = await api.post("/api/upload/direct", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return directRes.data.public_url || directRes.data.url;
  }
}
