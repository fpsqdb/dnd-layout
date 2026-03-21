import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type {
    Constraint,
    ContentFitMode,
    LayoutAlgorithm,
    LayoutItem,
    LayoutRenderConfig,
    MeasuredLayoutItem,
    MoveContext,
    RelayoutTrigger,
    RenderItem,
} from "../../core/types";
import { DragStore } from "../../store/dragStore";
import { LayoutStore } from "../../store/layoutStore";
import { type DragData, DragManager } from "../dragManager";

interface MockLayoutItem extends LayoutItem {
    name: string;
}

class MockLayoutAlgorithm implements LayoutAlgorithm<MockLayoutItem> {
    public containerTrigger: RelayoutTrigger = "width";
    public itemTrigger: RelayoutTrigger = "height";
    public contentFitMode: ContentFitMode = "none";

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
        _context: MoveContext<MockLayoutItem>,
    ): MockLayoutItem[] | false => {
        void _config;
        void _context;
        return _items.map((item) => item.data);
    };

    serialize = (item: RenderItem<MeasuredLayoutItem<MockLayoutItem>>): MockLayoutItem => {
        return item.data;
    };
}

const mockConstraint: Constraint = {
    constrain: () => {
        return {
            left: 12,
            top: 12,
        };
    },
};

describe("DragManager", () => {
    let layoutStore: LayoutStore<MockLayoutItem>;
    let dragStore: DragStore<MockLayoutItem>;
    let dragManager: DragManager<MockLayoutItem>;
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
        dragStore = new DragStore();
        dragManager = new DragManager(layoutStore, dragStore, []);
        dragManager.setContainer(container);
        dragManager.subscribeLayoutStore();
    });

    afterEach(() => {
        container.remove();
    });

    describe("setLayoutStore", () => {
        it("should return false when layoutStore null or undefined", async () => {
            expect(dragManager.setLayoutStore(null as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
            expect(dragManager.setLayoutStore(undefined as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
        });

        it("should return false when layoutStore not change", async () => {
            expect(dragManager.setLayoutStore(layoutStore)).toBe(false);
        });

        it("should pauseUpdateItems when layoutStore change and current is dragging", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 105, clientY: 105 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const mockItems2 = [
                { id: "1", name: "Item 1" },
                { id: "2", name: "Item 2" },
                { id: "3", name: "Item 3" },
            ];
            const layoutStore1 = new LayoutStore(mockItems2, mockAlgorithm);
            layoutStore1.setContainer(container);
            layoutStore1.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            expect(dragManager.setLayoutStore(layoutStore1)).toBe(true);

            layoutStore1.setItems([]);

            expect(layoutStore1.getSnapshot().layoutItems.length).toBe(3);
        });
    });

    describe("handleInternalDragStart", () => {
        it("isDragging should be false without move", () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);

            const initialState = dragStore.getSnapshot();
            expect(initialState.isDragging).toBe(false);
            expect(initialState.draggingId).toBe(null);
        });

        it("should handle drag start with touch pointer type", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "touch",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 150, clientY: 150 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const newState = dragStore.getSnapshot();
            expect(newState.isDragging).toBe(true);
            expect(newState.draggingId).toBe("1");
            expect(newState.placeholder?.data.id).toBe("1");
        });

        it("should not start drag for invalid item", async () => {
            const dragData: DragData = {
                draggingId: "invalid-id",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 150, clientY: 150 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const newState = dragStore.getSnapshot();
            expect(newState.isDragging).toBe(false);
            expect(newState.draggingId).toBe(null);
            expect(newState.placeholder).toBe(null);
        });

        it("should stop dragging when already dragging", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 150, clientY: 150 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");

            dragManager.handleInternalDragStart(event, dragData);
            const newState = dragStore.getSnapshot();
            expect(newState.isReturning).toBe(true);
            expect(newState.fixedReturnPosition).not.toBeNull();
        });

        it("should handle drag start with mouse pointer type and threshold 0", async () => {
            dragManager.setThreshold(0);

            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 100, clientY: 100 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");
        });

        it("should handle drag start with touch pointer type and threshold 0", async () => {
            dragManager.setThreshold(0);

            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "touch",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 100, clientY: 100 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");
        });
    });

    describe("drag interactions with threshold", () => {
        it("should start drag after passing threshold", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 105, clientY: 105 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");
        });

        it("should not start drag before reaching default mouse threshold", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 103, clientY: 103 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(false);
            expect(state.draggingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });

        it("should not start drag before reaching default touch threshold", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "touch",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 100 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(false);
            expect(state.draggingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });

        it("should not start drag before reaching custom threshold", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };
            dragManager.setThreshold(20);

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(false);
            expect(state.draggingId).toBe(null);
            expect(state.placeholder).toBe(null);
        });
    });

    describe("drag end behavior", () => {
        it("should end drag when Esc pressed", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");

            const escapeKeyEvent = new KeyboardEvent("keydown", { key: "Escape" });
            window.dispatchEvent(escapeKeyEvent);

            const netState = dragStore.getSnapshot();
            expect(netState.isReturning).toBe(true);
            expect(netState.fixedReturnPosition).not.toBe(null);
        });

        it("should not end drag when pressed key is not Esc", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");

            const escapeKeyEvent = new KeyboardEvent("keydown", { key: "a" });
            window.dispatchEvent(escapeKeyEvent);

            const netState = dragStore.getSnapshot();
            expect(netState.isDragging).toBe(true);
            expect(netState.draggingId).toBe("1");
            expect(netState.placeholder?.data.id).toBe("1");
        });

        it("should end drag when pointer up", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");

            const pointerUpEvent = new PointerEvent("pointerup", { clientX: 109, clientY: 113 });
            window.dispatchEvent(pointerUpEvent);

            const netState = dragStore.getSnapshot();
            expect(netState.isReturning).toBe(true);
            expect(netState.fixedReturnPosition).not.toBe(null);
        });
    });

    describe("dragging position css vars", () => {
        it("should update css vars when moving", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("80px 80px 0");

            const moveEvent2 = new PointerEvent("pointermove", { clientX: 130, clientY: 142 });
            window.dispatchEvent(moveEvent2);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("101px 109px 0");
        });

        it("should not update css vars after drag end", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("80px 80px 0");

            const pointerUpEvent = new PointerEvent("pointerup", { clientX: 109, clientY: 113 });
            window.dispatchEvent(pointerUpEvent);

            const moveEvent2 = new PointerEvent("pointermove", { clientX: 130, clientY: 142 });
            window.dispatchEvent(moveEvent2);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("80px 80px 0");
        });
    });

    describe("edge cases and error conditions", () => {
        it("should correct handle drag end when no items exist", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");

            // clear items
            layoutStore.setInternalItems([]);

            const pointerUpEvent = new PointerEvent("pointerup", { clientX: 109, clientY: 113 });
            window.dispatchEvent(pointerUpEvent);

            const netState = dragStore.getSnapshot();
            expect(netState.isDragging).toBe(false);
            expect(netState.draggingId).toBe(null);
            expect(netState.placeholder).toBe(null);
            expect(netState.isReturning).toBe(false);
            expect(netState.fixedReturnPosition).toBe(null);
        });

        it("should correct handle drag end when container is null", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            const state = dragStore.getSnapshot();
            expect(state.isDragging).toBe(true);
            expect(state.draggingId).toBe("1");
            expect(state.placeholder?.data.id).toBe("1");
            await new Promise((resolve) => requestAnimationFrame(resolve));

            dragManager.setContainer(null as unknown as HTMLElement);

            const pointerUpEvent = new PointerEvent("pointerup", { clientX: 109, clientY: 113 });
            window.dispatchEvent(pointerUpEvent);

            const netState = dragStore.getSnapshot();
            expect(netState.isDragging).toBe(false);
            expect(netState.draggingId).toBe(null);
            expect(netState.placeholder).toBe(null);
            expect(netState.isReturning).toBe(false);
            expect(netState.fixedReturnPosition).toBe(null);
        });
    });

    describe("constraints", () => {
        it("should apply constraints", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.setConstraints([mockConstraint]);
            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("12px 12px 0");

            dragManager.setConstraints(null as unknown as Constraint[]);

            const moveEvent2 = new PointerEvent("pointermove", { clientX: 130, clientY: 142 });
            window.dispatchEvent(moveEvent2);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("101px 109px 0");
        });
    });

    describe("auto scroller", () => {
        let originalSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        beforeEach(async () => {
            originalSize = {
                width: window.innerWidth,
                height: window.innerHeight,
            };
            await page.viewport(490, 490);
        });

        afterEach(async () => {
            await page.viewport(originalSize.width, originalSize.height);
        });

        it("should trigger autoScroller functionality", async () => {
            const dragData: DragData = {
                draggingId: "1",
                pointerOffset: {
                    local: { left: 20, top: 20 },
                    global: { left: 20, top: 20 },
                    scaleX: 1,
                    scaleY: 1,
                },
            };

            const event = {
                clientX: 100,
                clientY: 100,
                pointerType: "mouse",
            };

            dragManager.handleInternalDragStart(event, dragData);
            const moveEvent = new PointerEvent("pointermove", { clientX: 109, clientY: 113 });
            window.dispatchEvent(moveEvent);
            await new Promise((resolve) => requestAnimationFrame(resolve));

            const moveEvent1 = new PointerEvent("pointermove", { clientX: 109, clientY: 150 });
            window.dispatchEvent(moveEvent1);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("80px 117px 0");

            const moveEvent2 = new PointerEvent("pointermove", { clientX: 490, clientY: 490 });
            window.dispatchEvent(moveEvent2);
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(container.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("461px 457px 0");
        });
    });
});
