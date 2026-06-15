<template>
    <div
        id="it-facts-game"
        class="flex flex-col gap-y-8 bg-white/5 px-6 py-10 ring-1 ring-white/10 sm:rounded-3xl sm:p-8 lg:p-12"
    >
        <div class="flex flex-col gap-y-2">
            <h2
                class="text-2xl font-bold text-white"
                data-testid="it-facts-game-heading"
            >
                {{ itFactsApplication.name }}
            </h2>
            <p class="text-sm text-gray-300" data-testid="it-facts-progress">
                <template v-if="status === 'idle'"
                    >A round of {{ roundLength }} questions awaits</template
                >
                <template v-else-if="status === 'finished'"
                    >Round complete: {{ score }} of {{ roundLength }}</template
                >
                <template v-else
                    >Question {{ qIndex + 1 }} of {{ roundLength }}</template
                >
            </p>
            <UProgress
                v-model="progressValue"
                :max="roundLength"
                color="primary"
                animation="swing"
            />
        </div>

        <div v-if="status === 'idle'" class="flex flex-col gap-y-4">
            <p class="text-gray-300">
                Press Start to draw a fresh round of
                {{ roundLength }} questions. Your best score is saved on this
                device.
            </p>
            <div>
                <UButton
                    label="Start a round"
                    color="primary"
                    data-testid="start-round-button"
                    @click="start"
                />
            </div>
        </div>

        <div
            v-else-if="status === 'finished'"
            class="flex flex-col gap-y-4"
            data-testid="it-facts-result-region"
        >
            <ItFactsResult
                :score="score"
                :round-length="roundLength"
                :best="best"
                @restart="restart"
            />
        </div>

        <div v-else class="flex flex-col gap-y-6">
            <div
                class="rounded-2xl bg-gray-900/60 px-6 py-8 ring-1 ring-white/10"
            >
                <p
                    class="text-xl leading-8 text-white"
                    data-testid="it-facts-statement"
                >
                    {{ currentFact ? currentFact.statement : "" }}
                </p>
            </div>

            <div
                class="grid grid-flow-col gap-4 h-12"
                role="group"
                aria-label="Answer"
            >
                <UButton
                    label="True"
                    color="success"
                    variant="solid"
                    icon="i-heroicons-check"
                    :disabled="status !== 'playing'"
                    data-testid="answer-true"
                    @click="answer(true)"
                />
                <UButton
                    label="False"
                    color="error"
                    variant="solid"
                    icon="i-heroicons-x-mark"
                    :disabled="status !== 'playing'"
                    data-testid="answer-false"
                    @click="answer(false)"
                />
            </div>

            <div
                v-if="status === 'feedback' && currentFact"
                class="flex flex-col gap-y-6"
                role="status"
                aria-live="polite"
                data-testid="it-facts-feedback"
            >
                <div
                    class="flex flex-col gap-y-2 rounded-2xl bg-gray-900/60 px-6 py-4 ring-1 ring-white/10"
                >
                    <div class="flex flex-col gap-y-4">
                        <UBadge
                            :color="lastAnswerCorrect ? 'success' : 'error'"
                            :label="lastAnswerCorrect ? 'Correct' : 'Incorrect'"
                            variant="subtle"
                            data-testid="it-facts-feedback-badge"
                        />
                        <p class="text-sm text-white">
                            {{
                                currentFact.isTrue
                                    ? "It's true!"
                                    : "It's false!"
                            }}
                        </p>
                        <p
                            class="text-sm leading-6 text-gray-200"
                            data-testid="it-facts-explanation"
                        >
                            {{ currentFact.explanation }}
                        </p>
                    </div>
                </div>
                <UButton
                    trailing-icon="i-heroicons-arrow-right-16-solid"
                    :label="
                        qIndex === roundLength - 1
                            ? 'See result'
                            : 'Next question'
                    "
                    color="neutral"
                    variant="soft"
                    data-testid="it-facts-next"
                    @click="next"
                />
            </div>
            <p
                class="text-sm text-gray-300"
                data-testid="it-facts-running-score"
            >
                Score: {{ score }} / {{ roundLength }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { itFacts } from "@@/shared/data/it-facts.data";
import type { ItFact } from "@@/shared/types/it-facts.type";

const ROUND_LENGTH = 10;

type Status = "idle" | "playing" | "feedback" | "finished";

const { best, save } = useItFactsScore();

const facts = ref<ItFact[]>([]);
const qIndex = ref<number>(0);
const score = ref<number>(0);
const status = ref<Status>("idle");
const lastAnswerCorrect = ref<boolean>(false);

const roundLength = ROUND_LENGTH;
const currentFact = computed<ItFact | null>(
    () => facts.value[qIndex.value] ?? null,
);
const progressValue = computed<number | null>(() => {
    if (status.value === "idle") {
        return null;
    }
    if (status.value === "finished") {
        return roundLength;
    }
    return qIndex.value + (status.value === "feedback" ? 1 : 0);
});

function shuffle<T>(input: readonly T[]): T[] {
    const copy = [...input];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i] ?? null;
        const swap = copy[j] ?? null;
        if (tmp === null || swap === null) {
            continue;
        }
        copy[i] = swap;
        copy[j] = tmp;
    }
    return copy;
}

function start(): void {
    facts.value = shuffle(itFacts).slice(0, roundLength);
    qIndex.value = 0;
    score.value = 0;
    lastAnswerCorrect.value = false;
    status.value = "playing";
}

function restart(): void {
    start();
}

function answer(choice: boolean): void {
    const fact = currentFact.value;
    if (!fact || status.value !== "playing") {
        return;
    }
    const correct = choice === fact.isTrue;
    lastAnswerCorrect.value = correct;
    if (correct) {
        score.value += 1;
    }
    status.value = "feedback";
}

function next(): void {
    if (status.value !== "feedback") {
        return;
    }
    if (qIndex.value >= roundLength - 1) {
        status.value = "finished";
        save(score.value);
        return;
    }
    qIndex.value += 1;
    status.value = "playing";
}

defineExpose({ start, restart });
</script>
