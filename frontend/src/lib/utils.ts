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

