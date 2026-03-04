import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LayoutItem, RenderItem } from "../../core/types";
import { DragStore } from "../dragStore";

interface MockDragItem extends LayoutItem {
    name: string;
}

describe("DragStore", () => {
    let store: DragStore<MockDragItem>;
    let mockPosition: Pick<RenderItem<LayoutItem>, "left" | "top">;
    let mockPlaceholder: RenderItem<MockDragItem>;

    beforeEach(() => {
        store = new DragStore<MockDragItem>();
        mockPosition = { left: 100, top: 50 };
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
                isDragging: false,
                isReturning: false,
                fixedReturnPosition: null,
                draggingId: null,
                placeholder: null,
            });
        });
    });

    describe("setIsDragging", () => {
        it("should set dragging state to true", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDragging(true);
            expect(store.getSnapshot().isDragging).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should set dragging state to false", () => {
            store.setIsDragging(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDragging(false);
            expect(store.getSnapshot().isDragging).toBe(false);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if state unchanged", () => {
            store.setIsDragging(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDragging(true);
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("setIsReturning", () => {
        it("should set returning state to true", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsReturning(true);
            expect(store.getSnapshot().isReturning).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should set returning state to false", () => {
            store.setIsReturning(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsReturning(false);
            expect(store.getSnapshot().isReturning).toBe(false);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if state unchanged", () => {
            store.setIsReturning(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsReturning(true);
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("setFixedReturnPosition", () => {
        it("should set fixed return position", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setFixedReturnPosition(mockPosition);
            expect(store.getSnapshot().fixedReturnPosition).toEqual(mockPosition);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should clear fixed return position", () => {
            store.setFixedReturnPosition(mockPosition);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setFixedReturnPosition(null);
            expect(store.getSnapshot().fixedReturnPosition).toBeNull();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if position unchanged", () => {
            store.setFixedReturnPosition(mockPosition);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setFixedReturnPosition(mockPosition);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should use deep equality to compare positions", () => {
            store.setFixedReturnPosition(mockPosition);
            const listener = vi.fn();
            store.subscribe(listener);

            const samePosition = { left: 100, top: 50 };
            store.setFixedReturnPosition(samePosition);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should notify when position values change", () => {
            store.setFixedReturnPosition(mockPosition);
            const listener = vi.fn();
            store.subscribe(listener);

            store.setFixedReturnPosition({ left: 150, top: 80 });
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe("setDraggingId", () => {
        it("should set dragging item id", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDraggingId("item-1");
            expect(store.getSnapshot().draggingId).toBe("item-1");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should clear dragging item id", () => {
            store.setDraggingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDraggingId(null);
            expect(store.getSnapshot().draggingId).toBeNull();
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should not notify if id unchanged", () => {
            store.setDraggingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDraggingId("item-1");
            expect(listener).not.toHaveBeenCalled();
        });

        it("should allow changing dragging id", () => {
            store.setDraggingId("item-1");
            const listener = vi.fn();
            store.subscribe(listener);

            store.setDraggingId("item-2");
            expect(store.getSnapshot().draggingId).toBe("item-2");
            expect(listener).toHaveBeenCalledTimes(1);
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

            const newPlaceholder: RenderItem<MockDragItem> = {
                ...mockPlaceholder,
                data: { id: "2", name: "Item 2" },
            };

            store.setPlaceholder(newPlaceholder);
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe("reset", () => {
        it("should reset all state to defaults", () => {
            store.setIsDragging(true);
            store.setIsReturning(true);
            store.setFixedReturnPosition(mockPosition);
            store.setDraggingId("item-1");
            store.setPlaceholder(mockPlaceholder);

            const listener = vi.fn();
            store.subscribe(listener);

            store.reset();

            const snapshot = store.getSnapshot();
            expect(snapshot).toEqual({
                isDragging: false,
                isReturning: false,
                fixedReturnPosition: null,
                draggingId: null,
                placeholder: null,
            });
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should notify subscribers on reset", () => {
            store.setIsDragging(true);
            const listener = vi.fn();
            store.subscribe(listener);

            store.reset();
            expect(listener).toHaveBeenCalledTimes(1);
        });
    });

    describe("Combined operations", () => {
        it("should handle multiple state changes", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            store.setIsDragging(true);
            store.setDraggingId("item-1");
            store.setPlaceholder(mockPlaceholder);

            expect(listener).toHaveBeenCalledTimes(3);

            const snapshot = store.getSnapshot();
            expect(snapshot.isDragging).toBe(true);
            expect(snapshot.draggingId).toBe("item-1");
            expect(snapshot.placeholder).toEqual(mockPlaceholder);
        });

        it("should maintain state isolation", () => {
            store.setIsDragging(true);
            store.setDraggingId("item-1");

            const listener = vi.fn();
            store.subscribe(listener);

            store.setFixedReturnPosition(mockPosition);

            expect(listener).toHaveBeenCalledTimes(1);
            const snapshot = store.getSnapshot();
            expect(snapshot.isDragging).toBe(true);
            expect(snapshot.draggingId).toBe("item-1");
            expect(snapshot.fixedReturnPosition).toEqual(mockPosition);
        });
    });

    describe("subscribe", () => {
        it("should call the callback when state changes", () => {
            const store = new DragStore();
            const mockCallback = vi.fn();
            const unsubscribe = store.subscribe(mockCallback);

            store.setDraggingId("test-id");
            expect(mockCallback).toHaveBeenCalledTimes(1);

            unsubscribe();
            store.setDraggingId("test-id-2");
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it("should call _beforeBatchOrDelayNotify when batching notifications", () => {
            const store = new DragStore();
            const spy = vi.spyOn(store, "_beforeBatchOrDelayNotify");

            store.batchUpdate(() => {
                store.setDraggingId("test-id");
                store.setPlaceholder(null);
            });

            expect(spy).toHaveBeenCalled();
        });
    });
});
