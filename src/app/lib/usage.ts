// src/lib/usage.ts
export function getCurrentPeriodStart(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  // format YYYY-MM-DD za Postgres DATE
  return d.toISOString().slice(0, 10);
}
