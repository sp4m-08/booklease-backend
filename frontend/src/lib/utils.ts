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

export const ALL_VIT_SLOTS = [
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"
] as const;

/**
 * Returns the selectable exam slots for rental requests.
 * If the owner listed "All Slots", the requester can pick "All Slots" or ANY individual slot (A1-G2).
 */
export function getAvailableSlotOptions(slotString?: string, rentedSlotsString?: string) {
  const rented = (rentedSlotsString || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const normalized = (slotString || "").trim().toLowerCase();
  const isAllSlots = !slotString || normalized === "all slots" || normalized === "all";

  if (isAllSlots) {
    const unrentedSlots = ALL_VIT_SLOTS.filter((s) => !rented.includes(s.toUpperCase()));
    return [
      { label: "All Slots (Entire Duration)", value: "All Slots" },
      ...unrentedSlots.map((s) => ({ label: `Slot ${s}`, value: s })),
      { label: "Custom (Select Days)", value: "custom" },
    ];
  } else {
    const listedSlots = slotString
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !rented.includes(s.toUpperCase()));

    return [
      ...listedSlots.map((s) => ({ label: s.startsWith("Slot ") ? s : `Slot ${s}`, value: s })),
      { label: "Custom (Select Days)", value: "custom" },
    ];
  }
}

