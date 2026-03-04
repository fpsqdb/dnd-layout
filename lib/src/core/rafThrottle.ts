export class RAFThrottle {
    #rafId: number | null = null;

    throttle = (fn: () => void, callback?: () => void): void => {
        if (this.#rafId !== null) {
            return;
        }
        this.#rafId = requestAnimationFrame(() => {
            try {
                fn();
            } finally {
                this.#rafId = null;
                callback?.();
            }
        });
    };

    cancel = (): void => {
        if (this.#rafId !== null) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }
    };
}
