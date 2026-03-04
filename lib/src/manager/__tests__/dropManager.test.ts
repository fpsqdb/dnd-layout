import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    LayoutAlgorithm,
    LayoutItem,
    LayoutRenderConfig,
    MeasuredLayoutItem,
    MoveContext,
    RenderItem,
} from "../../core/types";
import { DropStore } from "../../store/dropStore";
import { LayoutStore } from "../../store/layoutStore";
import { DropManager } from "../dropManager";

interface MockLayoutItem extends LayoutItem {
    name: string;
}

class MockLayoutAlgorithm implements LayoutAlgorithm<MockLayoutItem> {
    public containerTrigger: "width" | "height" | "both" = "width";
    public itemTrigger: "width" | "height" | "both" = "height";

    get className(): string {
        return "mock-layout";
    }

    layout = (items: MeasuredLayoutItem<MockLayoutItem>[], _config: LayoutRenderConfig) => {
        void _config;
        const layoutItems = items.map((item, index) => ({
            left: index * 100,
            top: 0,
            width: 80,
            height: item.size?.height ?? 50,
            data: item,
        }));

        return layoutItems;
    };

    move = (
        _items: RenderItem<MeasuredLayoutItem<MockLayoutItem>>[],
        _config: LayoutRenderConfig,
        context: MoveContext<MockLayoutItem>,
    ): MockLayoutItem[] | false => {
        void _config;
        const { current } = context;
        if (current.data.id === "100") {
            return false;
        }
        return _items.map((item) => item.data);
    };

    serialize = (item: RenderItem<MeasuredLayoutItem<MockLayoutItem>>): MockLayoutItem => {
        return item.data;
    };
}

describe("DropManager", () => {
    let layoutStore: LayoutStore<MockLayoutItem>;
    let dropStore: DropStore<MockLayoutItem>;
    let dropManager: DropManager<MockLayoutItem>;
    let mockItems: MockLayoutItem[];
    let mockAlgorithm: MockLayoutAlgorithm;
    let container: HTMLElement;

    beforeEach(() => {
        mockItems = [
            { id: "1", name: "Item 1" },
            { id: "2", name: "Item 2" },
        ];
        mockAlgorithm = new MockLayoutAlgorithm();
        container = document.createElement("div");
        container.style.width = "500px";
        container.style.height = "500px";
        document.body.appendChild(container);
        layoutStore = new LayoutStore(mockItems, mockAlgorithm);
        layoutStore.setContainer(container);
        layoutStore.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
        dropStore = new DropStore();
        dropManager = new DropManager(layoutStore, dropStore);
        dropManager.setContainer(container);
        dropManager.subscribeLayoutStore();
    });

    afterEach(() => {
        container.remove();
    });

    describe("setLayoutStore", () => {
        it("should return false when layoutStore null or undefined", async () => {
            expect(dropManager.setLayoutStore(null as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
            expect(dropManager.setLayoutStore(undefined as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
        });

        it("should return false when layoutStore not change", async () => {
            expect(dropManager.setLayoutStore(layoutStore)).toBe(false);
        });

        it("should pauseUpdateItems when layoutStore change and current is dropping", async () => {
            const mockItem: MockLayoutItem = { id: "100", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);

            const mockItems2 = [
                { id: "1", name: "Item 1" },
                { id: "2", name: "Item 2" },
                { id: "3", name: "Item 3" },
            ];
            const layoutStore1 = new LayoutStore(mockItems2, mockAlgorithm);
            layoutStore1.setContainer(container);
            layoutStore1.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            expect(dropManager.setLayoutStore(layoutStore1)).toBe(true);

            layoutStore1.setItems([]);

            expect(layoutStore1.getSnapshot().layoutItems.length).toBe(3);
        });
    });

    describe("handleExternalDragEnter", () => {
        it("should handle external drag enter with valid item", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            const result = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(result).toBe(true);

            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);
        });

        it("should return false when no item is provided", () => {
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            const result = dropManager.handleExternalDragEnter(mockEvent, () => false);
            expect(result).toBe(false);

            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });

        it("should return false when already dropping", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            const firstResult = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(firstResult).toBe(true);

            let state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");

            const secondResult = dropManager.handleExternalDragEnter(mockEvent, () => ({ ...mockItem, id: "4" }));
            expect(secondResult).toBe(false);

            state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");
        });

        it("should handle external drag enter when layout not change", () => {
            const mockItem: MockLayoutItem = { id: "100", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            const result = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(result).toBe(true);

            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("100");

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "100")).toBe(true);
        });
    });

    describe("handleExternalDragOver", () => {
        it("should handle drag over when dropping", async () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);

            const dragOverEvent: Pick<PointerEvent, "clientX" | "clientY"> = {
                clientX: 110,
                clientY: 110,
            };

            dropManager.handleExternalDragOver(dragOverEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");
            expect(state.placeholder?.data.id).toBe("3");

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);
        });

        it("should handle drag over when not dropping", async () => {
            const dragOverEvent: Pick<PointerEvent, "clientX" | "clientY"> = {
                clientX: 110,
                clientY: 110,
            };

            dropManager.handleExternalDragOver(dragOverEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });
    });

    describe("handleExternalDragLeave", () => {
        it("should handle drag leave when not dropping", () => {
            dropManager.handleExternalDragLeave();

            const state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });

        it("should handle drag leave when dropping", async () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);

            const dragOverEvent: Pick<PointerEvent, "clientX" | "clientY"> = {
                clientX: 110,
                clientY: 110,
            };

            dropManager.handleExternalDragOver(dragOverEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            let state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");
            expect(state.placeholder?.data.id).toBe("3");
            let layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);

            dropManager.handleExternalDragLeave();

            state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);
            layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);
        });

        it("should handle drag leave correct when dropping item has been removed", async () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);

            const dragOverEvent: Pick<PointerEvent, "clientX" | "clientY"> = {
                clientX: 110,
                clientY: 110,
            };

            dropManager.handleExternalDragOver(dragOverEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            let state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");
            expect(state.placeholder?.data.id).toBe("3");
            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);

            layoutStore.setInternalItems([]);
            dropManager.handleExternalDragLeave();

            state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });
    });

    describe("handleExternalDrop", () => {
        it("should handle external drop with valid item", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            dropManager.handleExternalDrop(mockEvent, (_, item) => ({ ...item, id: "4" }));

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);
            expect(layoutItems.some((item) => item.data.id === "4")).toBe(true);
        });

        it("should handle external drop with invalid item", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            dropManager.handleExternalDrop(mockEvent, () => false);

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);
        });

        it("should handle external drop when not currently dropping", () => {
            const onDrop = vi.fn().mockImplementation((_, item) => item);
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDrop(mockEvent, onDrop);

            expect(onDrop).not.toHaveBeenCalled();
        });

        it("should skip drop when dropping item not exists", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            layoutStore.setInternalItems([]);
            dropManager.handleExternalDrop(mockEvent, (_, item) => ({ ...item, id: "4" }));

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);
            expect(layoutItems.some((item) => item.data.id === "4")).toBe(false);
        });
    });

    describe("timed cleanup behavior", () => {
        it("should handle cleanup when dragOverFired is false", () => {
            vi.useFakeTimers();

            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            dropManager.handleExternalDragEnter(mockEvent, () => mockItem);

            let state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");

            let layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);

            vi.advanceTimersByTime(600);

            state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);

            layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);

            vi.useRealTimers();
        });
    });

    describe("integration tests", () => {
        it("should handle complete drop cycle", () => {
            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            const enterResult = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(enterResult).toBe(true);
            let state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(true);
            expect(state.droppingId).toBe("3");
            expect(state.placeholder?.data.id).toBe("3");
            dropManager.handleExternalDragOver({ clientX: 110, clientY: 110 });

            let layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(true);

            dropManager.handleExternalDrop(mockEvent, (_, item) => ({ ...item, id: "4" }));

            state = dropStore.getSnapshot();
            expect(state.isDropping).toBe(false);
            expect(state.droppingId).toBe(null);
            expect(state.placeholder).toBe(null);

            layoutItems = layoutStore.getSnapshot().layoutItems;
            expect(layoutItems.some((item) => item.data.id === "3")).toBe(false);
            expect(layoutItems.some((item) => item.data.id === "4")).toBe(true);
        });
    });

    describe("specific uncovered lines", () => {
        it("should handle layout store subscription updates correctly", () => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            layoutStore.setContainer(container);
            layoutStore.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });

            dropManager.subscribeLayoutStore();

            // Update the store to trigger subscription
            const newItems = [...mockItems, { id: "3", name: "Item 3" }];
            layoutStore.setInternalItems(newItems);

            // This should trigger the subscription and potentially update the placeholder
            const mockItem: MockLayoutItem = { id: "4", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            // Enter to put us in dropping state
            const result = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(result).toBe(true);

            // Update again to trigger the subscription while dropping
            const finalItems = [...newItems, { id: "5", name: "Item 5" }];
            layoutStore.setInternalItems(finalItems);

            // Verify that the function executes without errors
            expect(() => {
                layoutStore.setInternalItems(finalItems);
            }).not.toThrow();

            document.body.removeChild(container);
        });

        it("should handle interval cleanup when dragOverFired remains false", () => {
            vi.useFakeTimers();

            const container = document.createElement("div");
            document.body.appendChild(container);
            layoutStore.setContainer(container);
            layoutStore.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });

            const mockItem: MockLayoutItem = { id: "3", name: "New Item" };
            const mockEvent: React.DragEvent = {
                clientX: 100,
                clientY: 100,
                dataTransfer: {} as DataTransfer,
            } as React.DragEvent;

            // Enter to start the interval
            const result = dropManager.handleExternalDragEnter(mockEvent, () => mockItem);
            expect(result).toBe(true);

            // Advance timers beyond the interval delay
            vi.advanceTimersByTime(250); // advance past the 200ms interval

            // Check that the operation completes without errors
            expect(() => {
                vi.advanceTimersByTime(250);
            }).not.toThrow();

            document.body.removeChild(container);
            vi.useRealTimers();
        });
    });
});
