export function waitForTaskHoldemNotificationWorker(pending: Promise<ServiceWorkerRegistration | undefined>, signal: AbortSignal): Promise<ServiceWorkerRegistration | undefined> {
  return new Promise((resolve) => {
    let settled = false;
    let worker: ServiceWorker | undefined;
    let onStateChange: (() => void) | undefined;
    const timer = setTimeout(() => finish(), 5000);

    function finish(registration?: ServiceWorkerRegistration): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      if (worker && onStateChange) worker.removeEventListener("statechange", onStateChange);
      resolve(registration);
    }

    function onAbort(): void { finish(); }

    async function observe(): Promise<void> {
      try {
        const registration = await pending;
        if (settled) return;
        if (!registration) { finish(); return; }
        worker = registration.active ?? registration.installing ?? registration.waiting ?? undefined;
        if (!worker) { finish(); return; }
        onStateChange = () => {
          if (registration.active?.state === "activated") finish(registration);
          else if (worker?.state === "redundant") finish();
        };
        worker.addEventListener("statechange", onStateChange);
        onStateChange();
      } catch {
        // Storage restrictions can block service workers without blocking desktop notifications.
        finish();
      }
    }

    if (signal.aborted) finish();
    else signal.addEventListener("abort", onAbort, { once: true });
    void observe();
  });
}
