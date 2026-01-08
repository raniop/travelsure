// Utility functions for BuyInsNew form

export function isValidIsraeliId(id: string): boolean {
  const s = id.trim().padStart(9, "0");
  if (!/^\d{9}$/.test(s)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(s[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

export function cn(...x: Array<string | false | undefined | null>): string {
  return x.filter(Boolean).join(" ");
}

export function fmtDateToInput(d?: string | null): string {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return "";
}

export function splitNameHe(full?: string | null): { first: string; last: string } {
  const name = (full || "").trim();
  if (!name) return { first: "", last: "" };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

export function sortCustomersByBirthDate<T extends { birthDate: string; lastNameHe?: string; lastNameEn?: string }>(customers: T[]): T[] {
  if (customers.length <= 1) return customers;

  const [first, ...rest] = customers;

  const sorted = [...rest].sort((a, b) => {
    const lastNameA = (a.lastNameHe || a.lastNameEn || "").trim();
    const lastNameB = (b.lastNameHe || b.lastNameEn || "").trim();

    if (lastNameA && lastNameB) {
      const lastNameCompare = lastNameA.localeCompare(lastNameB, "he");
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }
    } else if (lastNameA && !lastNameB) {
      return -1;
    } else if (!lastNameA && lastNameB) {
      return 1;
    }

    const dateA = a.birthDate || "";
    const dateB = b.birthDate || "";

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return dateA.localeCompare(dateB);
  });

  return [first, ...sorted];
}
