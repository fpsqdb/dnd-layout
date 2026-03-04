import { beforeEach, describe, expect, it, vi } from "vitest";
import { Store } from "../store";

interface TestStoreValue {
    count: number;
    name: string;
}

class TestStore extends Store<TestStoreValue> {
    #storeValue: TestStoreValue = {
        count: 0,
        name: "test",
    };

    getSnapshot = (): TestStoreValue => {
        return this.#storeValue;
    };

    setCount = (count: number): void => {
        this.#storeValue = {
            ...this.#storeValue,
            count,
        };
        this._notify();
    };

    setName = (name: string): void => {
        this.#storeValue = {
            ...this.#storeValue,
            name,
        };
        this._notify();
    };

    _beforeBatchOrDelayNotify = (): void => {
        // Empty implementation
    };
}

describe("Store", () => {
    let store: TestStore;

    beforeEach(() => {
        store = new TestStore();
    });

    describe("getSnapshot", () => {
        it("should return current state", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot).toEqual({ count: 0, name: "test" });
        });

        it("should return updated state after change", () => {
            store.setCount(5);
            const snapshot = store.getSnapshot();
            expect(snapshot.count).toBe(5);
        });
    });

    describe("subscribe", () => {
        it("should allow subscription to state changes", () => {
            const listener = vi.fn();
            const unsubscribe = store.subscribe(listener);
            expect(typeof unsubscribe).toBe("function");
        });

        it("should notify subscriber when state changes", () => {
            const listener = vi.fn();
            store.subscribe(listener);
            store.setCount(5);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should notify multiple subscribers", () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            store.subscribe(listener1);
            store.subscribe(listener2);
            store.setCount(5);
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it("should unsubscribe listener", () => {
            const listener = vi.fn();
            const unsubscribe = store.subscribe(listener);
            store.setCount(5);
            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            store.setName("updated");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should allow multiple subscriptions and unsubscriptions", () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            const unsub1 = store.subscribe(listener1);
            const unsub2 = store.subscribe(listener2);

            store.setCount(5);
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);

            unsub1();
            store.setName("updated");
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(2);

            unsub2();
            store.setName("updated");
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(2);
        });
    });

    describe("batchUpdate", () => {
        it("should batch multiple updates into single notification", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
                store.setName("batch");
            });

            expect(listener).toHaveBeenCalledTimes(1);
            const snapshot = store.getSnapshot();
            expect(snapshot.count).toBe(5);
            expect(snapshot.name).toBe("batch");
        });

        it("should not notify on intermediate updates during batch", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(1);
                store.setCount(2);
                store.setCount(3);
            });

            expect(listener).toHaveBeenCalledTimes(1);
            expect(store.getSnapshot().count).toBe(3);
        });

        it("should handle nested batch updates", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
                store.batchUpdate(() => {
                    store.setName("nested");
                });
            });

            expect(listener).toHaveBeenCalledTimes(1);
            const snapshot = store.getSnapshot();
            expect(snapshot.count).toBe(5);
            expect(snapshot.name).toBe("nested");
        });

        it("should notify after batch completes", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
            });

            expect(listener).toHaveBeenCalled();
        });
    });

    describe("delayUpdate", () => {
        it("should delay notification using microtask", async () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.delayUpdate(() => {
                store.setCount(5);
            });

            expect(listener).not.toHaveBeenCalled();

            await new Promise((resolve) => queueMicrotask(() => resolve(void 0)));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(store.getSnapshot().count).toBe(5);
        });

        it("should batch multiple delayUpdate calls", async () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.delayUpdate(() => {
                store.setCount(5);
            });

            store.delayUpdate(() => {
                store.setName("delayed");
            });

            await new Promise((resolve) => queueMicrotask(() => resolve(void 0)));

            expect(listener).toHaveBeenCalledTimes(1);
            const snapshot = store.getSnapshot();
            expect(snapshot.count).toBe(5);
            expect(snapshot.name).toBe("delayed");
        });

        it("should not create duplicate microtask queues", async () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.delayUpdate(() => {
                store.setCount(1);
            });

            store.delayUpdate(() => {
                store.setCount(2);
            });

            store.delayUpdate(() => {
                store.setCount(3);
            });

            await new Promise((resolve) => queueMicrotask(() => resolve(void 0)));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(store.getSnapshot().count).toBe(3);
        });

        it("should handle delayUpdate after batchUpdate", async () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
            });

            expect(listener).toHaveBeenCalledTimes(1);

            store.delayUpdate(() => {
                store.setName("delayed");
            });

            await new Promise((resolve) => queueMicrotask(() => resolve(void 0)));

            expect(listener).toHaveBeenCalledTimes(2);
        });
    });

    describe("isPendingNotify", () => {
        it("should return true during batch update", () => {
            let isPending = false;
            store.batchUpdate(() => {
                isPending = store._isPendingNotify();
            });
            expect(isPending).toBe(true);
        });

        it("should return false outside batch update", () => {
            const isPending = store._isPendingNotify();
            expect(isPending).toBe(false);
        });

        it("should return true during delay update", () => {
            let isPending = false;
            store.delayUpdate(() => {
                isPending = store._isPendingNotify();
            });
            expect(isPending).toBe(true);
        });
    });

    describe("notify", () => {
        it("should skip notification if pending", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
                store._notify();
            });

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should force notification if requested", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.batchUpdate(() => {
                store.setCount(5);
                store._notify(true);
            });

            expect(listener).toHaveBeenCalledTimes(2);
        });
    });
});
