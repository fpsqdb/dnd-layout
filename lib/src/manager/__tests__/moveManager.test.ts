import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import type {
    Constraint,
    LayoutAlgorithm,
    LayoutItem,
    LayoutRenderConfig,
    MeasuredLayoutItem,
    MoveContext,
    Rectangle,
    RenderItem,
} from "../../core/types";
import { LayoutStore } from "../../store/layoutStore";
import { MoveManager } from "../moveManager";

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

describe("MoveManager", () => {
    let layoutStore: LayoutStore<MockLayoutItem>;
    let moveManager: MoveManager<MockLayoutItem>;
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
        container.style.width = "400px";
        container.style.height = "500px";
        document.body.appendChild(container);
        layoutStore = new LayoutStore(mockItems, mockAlgorithm);
        layoutStore.setContainer(container);
        layoutStore.setConfig({ layoutSize: { layoutWidth: 400, layoutHeight: 500 }, gap: [0, 0] });
        moveManager = new MoveManager(layoutStore, []);
        moveManager.setContainer(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe("setLayoutStore", () => {
        it("should return false when layoutStore null or undefined", async () => {
            expect(moveManager.setLayoutStore(null as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
            expect(moveManager.setLayoutStore(undefined as unknown as LayoutStore<MockLayoutItem>)).toBe(false);
        });

        it("should return false when layoutStore not change", async () => {
            expect(moveManager.setLayoutStore(layoutStore)).toBe(false);
        });

        it("should return true when layoutStore change", async () => {
            const mockItems2 = [
                { id: "1", name: "Item 1" },
                { id: "2", name: "Item 2" },
                { id: "3", name: "Item 3" },
            ];
            const layoutStore1 = new LayoutStore(mockItems2, mockAlgorithm);
            layoutStore1.setContainer(container);
            layoutStore1.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            expect(moveManager.setLayoutStore(layoutStore1)).toBe(true);
        });
    });

    describe("addMovingListener", () => {
        it("should add and remove listeners", () => {
            const listener = vi.fn();
            const removeListener = moveManager.addMovingListener(listener);

            expect(removeListener).toBeInstanceOf(Function);
            expect(() => removeListener()).not.toThrow();
        });

        it("should notify listeners when moving", () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);

            const layoutItems = [
                {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 50,
                    data: { id: "1", name: "Item 1" },
                },
            ];

            const pointer = { clientX: 50, clientY: 25 };
            moveManager.startMove({ left: 0, top: 0 });
            moveManager.move(layoutItems, "1", pointer);

            expect(listener).toHaveBeenCalled();
        });

        it("should not notify listeners when not moving", () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);

            const layoutItems = [
                {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 50,
                    data: { id: "1", name: "Item 1" },
                },
            ];

            const pointer = { clientX: 50, clientY: 25 };
            moveManager.setContainer(null as unknown as HTMLElement);
            moveManager.startMove({ left: 0, top: 0 });
            moveManager.move(layoutItems, "1", pointer);

            expect(listener).not.toBeCalledTimes(1);
        });
    });

    describe("stopMove", () => {
        it("should reset internal state when stopping", () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);

            const layoutItems = [
                {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 50,
                    data: { id: "1", name: "Item 1" },
                },
            ];

            const pointer = { clientX: 50, clientY: 25 };
            moveManager.setContainer(null as unknown as HTMLElement);
            moveManager.startMove({ left: 0, top: 0 });
            moveManager.move(layoutItems, "1", pointer);

            expect(listener).not.toBeCalledTimes(1);

            moveManager.stopMove();
            moveManager.move(layoutItems, "1", pointer);

            expect(listener).not.toBeCalledTimes(1);
        });
    });

    describe("getFixedReturnPosition", () => {
        it("should return null when without container", () => {
            moveManager.setContainer(null as unknown as HTMLElement);
            const result = moveManager.getFixedReturnPosition(layoutStore.getSnapshot().layoutItems[0]);
            expect(result).toBeNull();
        });

        it("should return position with container", () => {
            const result = moveManager.getFixedReturnPosition(layoutStore.getSnapshot().layoutItems[0]);
            expect(result).toEqual({ left: 0, top: 0 });
        });

        it("should return position with fixed offset parent", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "500px";
            const fixedParent = document.createElement("div");
            fixedParent.style.position = "absolute";
            fixedParent.style.left = "0px";
            fixedParent.style.top = "0px";
            fixedParent.style.translate = "10px 20px 0";
            fixedParent.style.borderWidth = "10px";
            fixedParent.style.padding = "10px";
            fixedParent.style.width = "100px";
            fixedParent.style.height = "100px";
            fixedParent.appendChild(container);
            document.body.appendChild(fixedParent);

            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            layoutStore.setContainer(container);
            moveManager.setContainer(container);

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            const pointer = { clientX: 20, clientY: 30 };
            moveManager.startMove(layoutItems[0]);
            moveManager.move(layoutItems, "1", pointer);

            const result = moveManager.getFixedReturnPosition(layoutItems[0]);
            expect(result).toEqual({ left: 10, top: 10 });
            expect(listener).toBeCalledWith({
                localPosition: { left: 0, top: 0 },
                fixedPosition: { left: 10, top: 10 },
                globalPosition: { left: 20, top: 30 },
            });

            document.body.removeChild(fixedParent);
        });
    });

    describe("move", () => {
        it("should perform move operation", () => {
            const layoutItems = layoutStore.getSnapshot().layoutItems;
            const pointer = { clientX: 50, clientY: 25 };
            const result = moveManager.move(layoutItems, "1", pointer);

            expect(result).toBe(true);
        });

        it("should not move without container", () => {
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };

            moveManager.setContainer(null as unknown as HTMLElement);
            const result = moveManager.move(layoutItems, "1", pointer);
            expect(result).toBe(false);
        });

        it("should not move without matching item", () => {
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };

            const result = moveManager.move(layoutItems, "nonexistent", pointer);
            expect(result).toBe(false);
        });

        it("should not move when algorithm.move returns false", () => {
            const container = document.createElement("div");
            document.body.appendChild(container);
            moveManager.setContainer(container);

            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };

            const originalLayoutAlgorithm = layoutStore.getLayoutAlgorithm();
            const mockAlgorithm: MockLayoutAlgorithm = Object.assign(
                {},
                originalLayoutAlgorithm,
                {
                    move: () => {
                        return false;
                    },
                },
                {
                    className: "MockLayoutAlgorithm",
                },
            );

            vi.spyOn(layoutStore, "getLayoutAlgorithm").mockReturnValue(mockAlgorithm);

            const result = moveManager.move(layoutItems, "1", pointer);
            expect(result).toBe(false);
        });

        it("should notify correct position with fixed offset parent", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "500px";
            const fixedParent = document.createElement("div");
            fixedParent.style.position = "absolute";
            fixedParent.style.left = "0px";
            fixedParent.style.top = "0px";
            fixedParent.style.translate = "10px 20px 0";
            fixedParent.style.borderWidth = "10px";
            fixedParent.style.padding = "10px";
            fixedParent.style.width = "100px";
            fixedParent.style.height = "100px";
            fixedParent.style.scale = "0.5";
            fixedParent.appendChild(container);
            document.body.appendChild(fixedParent);

            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            layoutStore.setContainer(container);
            moveManager.setContainer(container);

            const layoutItems = layoutStore.getSnapshot().layoutItems;
            const pointer = { clientX: 20, clientY: 30 };
            moveManager.startMove(layoutItems[0]);
            moveManager.move(layoutItems, "1", pointer);

            const result = moveManager.getFixedReturnPosition(layoutItems[0]);
            expect(result).toEqual({ left: 10, top: 10 });
            expect(listener).toBeCalledWith({
                localPosition: { left: -50, top: -50 },
                fixedPosition: { left: -40, top: -40 },
                globalPosition: { left: 20, top: 30 },
            });

            document.body.removeChild(fixedParent);
        });
    });

    describe("rafMove", () => {
        it("should schedule move on next frame", async () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };

            moveManager.rafMove(layoutItems, "1", pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(listener).toBeCalledTimes(1);
        });
    });

    describe("constraint handling", () => {
        it("should apply constraints to movement", () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            const constraint: Constraint = {
                constrain: (context) => {
                    return {
                        left: context.localPosition.left + 10,
                        top: context.localPosition.top + 10,
                    };
                },
            };

            moveManager.setConstraints([constraint]);
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };
            const result = moveManager.move(layoutItems, "1", pointer);
            expect(result).toBe(true);

            const position = moveManager.getFixedReturnPosition(layoutItems[0]);
            expect(position).toEqual({ left: 0, top: 0 });
            expect(listener).toBeCalledWith({
                localPosition: { left: 60, top: 35 },
                fixedPosition: { left: 60, top: 35 },
                globalPosition: { left: 50, top: 25 },
            });
        });

        it("globalPositionToLocalPosition", () => {
            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            const constraint: Constraint = {
                constrain: (context) => {
                    return context.globalPositionToLocalPosition(context.globalPosition);
                },
            };

            moveManager.setConstraints([constraint]);
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };
            const result = moveManager.move(layoutItems, "1", pointer);
            expect(result).toBe(true);

            const position = moveManager.getFixedReturnPosition(layoutItems[0]);
            expect(position).toEqual({ left: 0, top: 0 });
            expect(listener).toBeCalledWith({
                localPosition: { left: 50, top: 25 },
                fixedPosition: { left: 50, top: 25 },
                globalPosition: { left: 50, top: 25 },
            });
        });

        it("globalPositionToLocalPosition with fixed offset parent", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "500px";
            const fixedParent = document.createElement("div");
            fixedParent.style.position = "absolute";
            fixedParent.style.left = "0px";
            fixedParent.style.top = "0px";
            fixedParent.style.translate = "10px 20px 0";
            fixedParent.style.borderWidth = "10px";
            fixedParent.style.padding = "10px";
            fixedParent.style.width = "100px";
            fixedParent.style.height = "100px";
            fixedParent.appendChild(container);
            document.body.appendChild(fixedParent);
            layoutStore.setContainer(container);
            moveManager.setContainer(container);

            const listener = vi.fn();
            moveManager.addMovingListener(listener);
            const constraint: Constraint = {
                constrain: (context) => {
                    return context.globalPositionToLocalPosition(context.globalPosition);
                },
            };

            moveManager.setConstraints([constraint]);
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            moveManager.startMove(layoutItems[0]);
            const pointer = { clientX: 50, clientY: 25 };
            const result = moveManager.move(layoutItems, "1", pointer);
            expect(result).toBe(true);

            const position = moveManager.getFixedReturnPosition(layoutItems[0]);
            expect(position).toEqual({ left: 10, top: 10 });
            expect(listener).toBeCalledWith({
                localPosition: { left: 30, top: -5 },
                fixedPosition: { left: 40, top: 5 },
                globalPosition: { left: 50, top: 25 },
            });

            document.body.removeChild(fixedParent);
        });
    });

    describe("window resize handling", () => {
        it("should register and unregister window resize listener", async () => {
            const originalSize = {
                width: window.innerWidth,
                height: window.innerHeight,
            };
            let windowRect: Rectangle | null = null;
            const constraint: Constraint = {
                constrain: (context) => {
                    windowRect = context.windowRect;
                    return {
                        left: context.localPosition.left + 10,
                        top: context.localPosition.top + 10,
                    };
                },
            };
            moveManager.setConstraints([constraint]);
            moveManager.startMove({ left: 0, top: 0 });
            const layoutItems = layoutStore.getSnapshot().layoutItems;

            const pointer = { clientX: 50, clientY: 25 };
            let result = moveManager.move(layoutItems, "1", pointer);

            expect(result).toBe(true);
            expect(windowRect).toEqual({ left: 0, top: 0, width: originalSize.width, height: originalSize.height });

            await page.viewport(600, 600);
            window.dispatchEvent(new Event("resize"));
            const pointer1 = { clientX: 100, clientY: 100 };
            result = moveManager.move(layoutItems, "1", pointer1);

            expect(result).toBe(true);
            expect(windowRect).toEqual({ left: 0, top: 0, width: 600, height: 600 });

            await page.viewport(originalSize.width, originalSize.height);
        });
    });
});
