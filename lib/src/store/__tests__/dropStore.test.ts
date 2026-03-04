import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LayoutItem, RenderItem } from "../../core/types";
import { DropStore } from "../dropStore";

interface MockDropItem extends LayoutItem {
    name: string;
}

describe("DropStore", () => {
    let store: DropStore<MockDropItem>;
    let mockPlaceholder: RenderItem<MockDropItem>;

    beforeEach(() => {
        store = new DropStore<MockDropItem>();
        mockPlaceholder = {
            left: 100,
            top: 50,
            width: 80,
            height: 60,
            data: { id: "1", name: "Item 1" },
        };
    });

    describe("Initialization", () => {
        it("should initialize with default values", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot).toEqual({
                isDropping: false,
                droppingId: null,
                placeholder: null,
            });
        });
    });

    describe("setIsDropping", () => {
        it("should set dropping state to true", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(true);
            expect(store.getSnapshot().isDropping).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should set dropping state to false", () => {
            store.setIsDropping(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(false);
            expect(store.getSnapshot().isDropping).toBe(false);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if state unchanged", () => {
            store.setIsDropping(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(true);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should toggle dropping state", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(true);
            expect(store.getSnapshot().isDropping).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);

            store.setIsDropping(false);
            expect(store.getSnapshot().isDropping).toBe(false);
            expect(listener).toHaveBeenCalledTimes(2);
        });
    });

    describe("setDroppingId", () => {
        it("should set dropping item id", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDroppingId("item-1");
            expect(store.getSnapshot().droppingId).toBe("item-1");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should clear dropping item id", () => {
            store.setDroppingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDroppingId(null);
            expect(store.getSnapshot().droppingId).toBeNull();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if id unchanged", () => {
            store.setDroppingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDroppingId("item-1");
            expect(listener).not.toHaveBeenCalled();
        });

        it("should allow changing dropping id", () => {
            store.setDroppingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDroppingId("item-2");
            expect(store.getSnapshot().droppingId).toBe("item-2");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should handle null id transition", () => {
            store.setDroppingId("item-1");
            expect(store.getSnapshot().droppingId).toBe("item-1");

            store.setDroppingId(null);
            expect(store.getSnapshot().droppingId).toBeNull();

            store.setDroppingId("item-2");
            expect(store.getSnapshot().droppingId).toBe("item-2");
        });
    });

    describe("setPlaceholder", () => {
        it("should set placeholder", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setPlaceholder(mockPlaceholder);
            expect(store.getSnapshot().placeholder).toEqual(mockPlaceholder);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should handle undefined", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setPlaceholder(undefined);
            expect(store.getSnapshot().placeholder).toEqual(null);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should clear placeholder", () => {
            store.setPlaceholder(mockPlaceholder);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setPlaceholder(null);
            expect(store.getSnapshot().placeholder).toBeNull();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if placeholder unchanged", () => {
            store.setPlaceholder(mockPlaceholder);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setPlaceholder(mockPlaceholder);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should update placeholder with different item", () => {
            store.setPlaceholder(mockPlaceholder);
            const listener = vi.fn();
            store.subscribe(listener);

            const newPlaceholder: RenderItem<MockDropItem> = {
                ...mockPlaceholder,
                data: { id: "2", name: "Item 2" },
            };

            store.setPlaceholder(newPlaceholder);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should handle different placeholder positions", () => {
            store.setPlaceholder(mockPlaceholder);
            const listener = vi.fn();
            store.subscribe(listener);

            const movedPlaceholder: RenderItem<MockDropItem> = {
                ...mockPlaceholder,
                left: 200,
                top: 100,
            };

            store.setPlaceholder(movedPlaceholder);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(store.getSnapshot().placeholder?.left).toBe(200);
            expect(store.getSnapshot().placeholder?.top).toBe(100);
        });
    });

    describe("reset", () => {
        it("should reset all state to defaults", () => {
            store.setIsDropping(true);
            store.setDroppingId("item-1");
            store.setPlaceholder(mockPlaceholder);

            const listener = vi.fn();
            store.subscribe(listener);

            store.reset();

            const snapshot = store.getSnapshot();
            expect(snapshot).toEqual({
                isDropping: false,
                droppingId: null,
                placeholder: null,
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should notify subscribers on reset", () => {
            store.setIsDropping(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.reset();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should clear all state when resetting from filled state", () => {
            store.setIsDropping(true);
            store.setDroppingId("item-123");
            store.setPlaceholder(mockPlaceholder);

            store.reset();

            const snapshot = store.getSnapshot();
            expect(snapshot.isDropping).toBe(false);
            expect(snapshot.droppingId).toBeNull();
            expect(snapshot.placeholder).toBeNull();
        });
    });

    describe("Combined operations", () => {
        it("should handle multiple state changes", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(true);
            store.setDroppingId("item-1");
            store.setPlaceholder(mockPlaceholder);

            expect(listener).toHaveBeenCalledTimes(3);

            const snapshot = store.getSnapshot();
            expect(snapshot.isDropping).toBe(true);
            expect(snapshot.droppingId).toBe("item-1");
            expect(snapshot.placeholder).toEqual(mockPlaceholder);
        });

        it("should maintain state isolation", () => {
            store.setIsDropping(true);
            store.setDroppingId("item-1");

            const listener = vi.fn();
            store.subscribe(listener);

            store.setPlaceholder(mockPlaceholder);

            expect(listener).toHaveBeenCalledTimes(1);
            const snapshot = store.getSnapshot();
            expect(snapshot.isDropping).toBe(true);
            expect(snapshot.droppingId).toBe("item-1");
            expect(snapshot.placeholder).toEqual(mockPlaceholder);
        });

        it("should handle drop lifecycle", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDropping(true);
            store.setDroppingId("item-1");
            expect(listener).toHaveBeenCalledTimes(2);

            store.setPlaceholder(mockPlaceholder);
            expect(listener).toHaveBeenCalledTimes(3);

            store.setIsDropping(false);
            expect(listener).toHaveBeenCalledTimes(4);

            store.reset();
            expect(listener).toHaveBeenCalledTimes(5);
        });
    });

    describe("Subscription", () => {
        it("should support multiple subscribers", () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            store.subscribe(listener1);
            store.subscribe(listener2);

            store.setIsDropping(true);
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it("should allow unsubscription", () => {
            const listener = vi.fn();
            const unsubscribe = store.subscribe(listener);

            store.setIsDropping(true);
            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            store.setIsDropping(false);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should call _beforeBatchOrDelayNotify when batching notifications", () => {
            const store = new DropStore();
            const spy = vi.spyOn(store, "_beforeBatchOrDelayNotify");

            store.batchUpdate(() => {
                store.setDroppingId("test-id");
                store.setPlaceholder(null);
            });

            expect(spy).toHaveBeenCalled();
        });
    });
});
