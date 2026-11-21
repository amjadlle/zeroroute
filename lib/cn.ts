/** Joins class names, skipping falsy values. Add tailwind-merge only if real class conflicts appear. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
