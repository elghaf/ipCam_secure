import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs - Class names to combine
 * @returns Merged and deduplicated class names string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
