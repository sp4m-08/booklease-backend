import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${backendUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

/**
 * Strips registration numbers (e.g., 23BCE2109, 23bec0174, 99GEN0001, (23BCE2109))
 * and formats student names cleanly for privacy across all pages.
 */
export function formatStudentName(rawName?: string, defaultName = "Student"): string {
  if (!rawName) return defaultName;
  const cleaned = rawName
    .replace(/\(?\b\d{2}[A-Za-z]{2,4}\d{3,5}\b\)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || defaultName;
}

