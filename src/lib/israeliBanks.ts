export type IsraeliBank = { code: string; name: string };
export type IsraeliBranch = { bankCode: string; code: string; name: string; city: string };
export type IsraeliBanksData = { banks: IsraeliBank[]; branches: IsraeliBranch[] };

let cached: IsraeliBanksData | null = null;
let loading: Promise<IsraeliBanksData> | null = null;

export async function loadIsraeliBanksData(): Promise<IsraeliBanksData> {
  if (cached) return cached;
  if (!loading) {
    loading = fetch("/data/israeliBanks.json", { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error("banks_load_failed");
        const data = (await res.json()) as IsraeliBanksData;
        cached = {
          banks: Array.isArray(data.banks) ? data.banks : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
        };
        return cached;
      })
      .catch(() => {
        loading = null;
        return { banks: [], branches: [] };
      });
  }
  return loading;
}

export function branchesForBank(data: IsraeliBanksData, bankCode: string): IsraeliBranch[] {
  if (!bankCode) return [];
  return data.branches
    .filter((b) => b.bankCode === bankCode)
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export function filterBranches(branches: IsraeliBranch[], query: string): IsraeliBranch[] {
  const q = query.trim().toLowerCase();
  if (!q) return branches.slice(0, 40);
  return branches
    .filter((b) => {
      const hay = `${b.code} ${b.name} ${b.city}`.toLowerCase();
      return hay.includes(q) || b.code.replace(/^0+/, "") === q.replace(/^0+/, "");
    })
    .slice(0, 40);
}

export function findBranchByCode(branches: IsraeliBranch[], code: string): IsraeliBranch | undefined {
  const c = code.trim().replace(/^0+/, "");
  if (!c) return undefined;
  return branches.find((b) => b.code.replace(/^0+/, "") === c || b.code === code.trim());
}
