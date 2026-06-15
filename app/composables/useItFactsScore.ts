const STORAGE_KEY = "it-facts:best";

function readBest(): number {
  if (!import.meta.client) {
    return 0;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return 0;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function writeBest(value: number): void {
  if (!import.meta.client) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, String(value));
}

export default function useItFactsScore(): {
  best: ComputedRef<number>;
  save: (score: number) => void;
} {
  const stored = ref<number>(0);
  const best = computed<number>(() => stored.value);

  onMounted(() => {
    stored.value = readBest();
  });

  function save(score: number): void {
    if (!Number.isFinite(score) || score < 0) {
      return;
    }
    if (score <= stored.value) {
      return;
    }
    stored.value = score;
    writeBest(score);
  }

  return { best, save };
}
