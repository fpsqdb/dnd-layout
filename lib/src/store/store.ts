export type StoreListener = () => void;

export interface IStore<T> {
    getSnapshot: () => T;
    subscribe: (listener: StoreListener) => () => void;
    batchUpdate: (update: () => void) => void;
    delayUpdate: (update: () => void) => void;
}

export abstract class Store<T> implements IStore<T> {
    #listeners = new Set<StoreListener>();
    #batchDepth = 0;
    #isDelayUpdating = false;
    #isDelayUpdateQueued = false;

    subscribe = (listener: StoreListener): (() => void) => {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    };

    abstract getSnapshot(): T;
    abstract _beforeBatchOrDelayNotify(): void;

    batchUpdate = (update: () => void): void => {
        this.#batchDepth++;
        try {
            update();
        } finally {
            this.#batchDepth--;
            if (this.#batchDepth === 0) {
                this._beforeBatchOrDelayNotify();
                this._notify();
            }
        }
    };

    delayUpdate = (update: () => void): void => {
        this.#isDelayUpdating = true;
        try {
            update();
        } finally {
            if (!this.#isDelayUpdateQueued) {
                this.#isDelayUpdateQueued = true;
                queueMicrotask(() => {
                    this.#isDelayUpdating = false;
                    this.#isDelayUpdateQueued = false;
                    this._beforeBatchOrDelayNotify();
                    this._notify();
                });
            }
        }
    };

    _isPendingNotify = (): boolean => {
        return this.#batchDepth > 0 || this.#isDelayUpdating;
    };

    _notify = (force?: boolean): void => {
        if (force !== true && this._isPendingNotify()) {
            return;
        }
        this.#listeners.forEach((listener) => {
            listener();
        });
    };
}
