<template>
  <section aria-label="Room summary export" class="rounded-xl border border-default bg-muted p-4">
    <p class="text-xs font-medium text-default">Take the results with you</p>
    <p class="mt-1 text-[11px] leading-5 text-muted">All revealed rounds · Player names and votes · UTC timestamps · No chat</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <UButton label="Copy summary" icon="i-heroicons-clipboard-document" variant="soft" size="xs" :disabled="count === 0 || busy !== null" :loading="busy === 'copy'" @click="exportReport('copy')" />
      <UButton label="Download CSV" icon="i-heroicons-arrow-down-tray" color="neutral" variant="soft" size="xs" :disabled="count === 0 || busy !== null" :loading="busy === 'csv'" @click="exportReport('csv')" />
      <UButton v-if="busy" label="Cancel export" color="neutral" variant="ghost" size="xs" @click="cancelExport" />
    </div>
    <p v-if="status" role="status" class="mt-3 text-xs text-muted">{{ status }}</p>
    <p v-if="error" role="alert" class="mt-3 text-xs text-warning">{{ error }}</p>
    <div v-if="preparedText !== null" class="mt-3 space-y-2">
      <label for="task-holdem-summary" class="block text-xs text-toned">Select and copy this summary</label>
      <textarea id="task-holdem-summary" :value="preparedText" readonly rows="8" class="w-full rounded-lg border border-accented bg-default p-3 text-xs text-toned outline-none focus-visible:ring-2 focus-visible:ring-primary" @focus="selectSummary" />
      <UButton label="Copy prepared summary" color="neutral" variant="outline" size="xs" @click="copyPrepared" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatTaskHoldemReportCsv, formatTaskHoldemReportText, loadTaskHoldemReport, type TaskHoldemHistoryLoader } from "../../utils/report";
import type { TaskHoldemVote } from "../../../shared/types/room.type";

const props = defineProps<{ count: number; deck: TaskHoldemVote[]; load: TaskHoldemHistoryLoader }>();
const busy = ref<"copy" | "csv" | null>(null);
const status = ref<string | null>(null);
const error = ref<string | null>(null);
const preparedText = ref<string | null>(null);
let controller: AbortController | undefined;
let disposed = false;
const downloads = new Map<string, ReturnType<typeof setTimeout>>();

function selectSummary(event: Event): void {
  if (event.target instanceof HTMLTextAreaElement) event.target.select();
}

async function copyPrepared(): Promise<void> {
  if (preparedText.value === null) return;
  const text = preparedText.value;
  try {
    await navigator.clipboard.writeText(text);
    if (disposed || preparedText.value !== text) return;
    preparedText.value = null;
    status.value = "Room summary copied.";
    error.value = null;
  } catch {
    if (!disposed && preparedText.value === text) error.value = "Automatic copying isn't available here. Select and copy the summary below.";
  }
}

function downloadCsv(csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `task-holdem-results-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); }
  // WebKit may consume the object URL after the click handler has returned.
  downloads.set(url, setTimeout(() => { URL.revokeObjectURL(url); downloads.delete(url); }, 1000));
}

async function exportReport(kind: "copy" | "csv"): Promise<void> {
  if (busy.value || props.count === 0) return;
  const current = new AbortController();
  controller = current;
  const through = props.count;
  const deck = [...props.deck];
  busy.value = kind;
  error.value = null;
  preparedText.value = null;
  status.value = `Preparing ${through} revealed ${through === 1 ? "round" : "rounds"}…`;
  try {
    const entries = await loadTaskHoldemReport(props.load, through, current.signal);
    if (disposed || current.signal.aborted) return;
    if (kind === "csv") {
      downloadCsv(formatTaskHoldemReportCsv(entries, deck));
      status.value = "Room CSV download started.";
    } else {
      const text = formatTaskHoldemReportText(entries, deck);
      try {
        await navigator.clipboard.writeText(text);
        if (!disposed && !current.signal.aborted) status.value = "Room summary copied.";
      } catch {
        if (disposed || current.signal.aborted) return;
        status.value = null;
        preparedText.value = text;
        error.value = "Automatic copying isn't available here. Select and copy the summary below.";
      }
    }
  } catch {
    if (!disposed && !current.signal.aborted) {
      status.value = null;
      error.value = "The complete room summary couldn't be prepared. Check your connection and try again; no partial report was exported.";
    }
  } finally {
    if (controller === current) { controller = undefined; busy.value = null; }
  }
}

function cancelExport(): void {
  controller?.abort();
  controller = undefined;
  busy.value = null;
  status.value = "Export cancelled.";
}

onScopeDispose(() => {
  disposed = true;
  controller?.abort();
  for (const [url, timer] of downloads) { clearTimeout(timer); URL.revokeObjectURL(url); }
});
</script>
