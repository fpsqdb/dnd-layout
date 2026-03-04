import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
    LayoutAlgorithm,
    LayoutItem,
    LayoutRenderConfig,
    MeasuredLayoutItem,
    MoveContext,
    RelayoutTrigger,
    RenderItem,
} from "../../core/types";
import { LayoutStore } from "../layoutStore";

class MockLayoutAlgorithm implements LayoutAlgorithm<MockLayoutItem> {
    public containerTrigger: RelayoutTrigger;
    public itemTrigger: RelayoutTrigger;

    constructor(containerTrigger: RelayoutTrigger = "width", itemTrigger: RelayoutTrigger = "height") {
        this.containerTrigger = containerTrigger;
        this.itemTrigger = itemTrigger;
    }

    get className(): string {
        return "mock-layout";
    }

    layout = (items: MeasuredLayoutItem<MockLayoutItem>[], _config: LayoutRenderConfig) => {
        void _config;
        return items.map((item, index) => ({
            left: index * 100,
            top: 0,
            width: 80,
            height: item.size?.height ?? 50,
            data: item,
        }));
    };

    move = (
        items: RenderItem<MeasuredLayoutItem<MockLayoutItem>>[],
        _config: LayoutRenderConfig,
        _context: MoveContext<MockLayoutItem>,
    ) => {
        void _config;
        void _context;
        return items.map((item) => item.data);
    };

    serialize = (item: RenderItem<MeasuredLayoutItem<MockLayoutItem>>) => {
        return {
            id: item.data.id,
            name: item.data.name,
        };
    };
}

interface MockLayoutItem extends LayoutItem {
    name: string;
}

describe("LayoutStore", () => {
    let store: LayoutStore<MockLayoutItem>;
    let mockItems: MockLayoutItem[];
    let mockAlgorithm: MockLayoutAlgorithm;

    beforeEach(() => {
        mockItems = [
            { id: "1", name: "Item 1" },
            { id: "2", name: "Item 2" },
            { id: "3", name: "Item 3" },
        ];
        mockAlgorithm = new MockLayoutAlgorithm("width", "height");
        store = new LayoutStore(mockItems, mockAlgorithm);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Initialization", () => {
        it("should initialize with initial items", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(3);
            expect(snapshot.items[0].id).toBe("1");
        });

        it("should initialize empty renderItems", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot.renderItems).toHaveLength(0);
            expect(snapshot.layoutItems).toHaveLength(0);
        });

        it("should initialize zero container size", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot.containerSize).toEqual({ width: 0, height: 0 });
        });
    });

    describe("setContainer", () => {
        it("should set container element and allow layout to proceed", () => {
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            container.style.boxSizing = "content-box";
            document.body.appendChild(container);

            store.setContainer(container);

            store.setConfig({
                layoutSize: { layoutWidth: 500, layoutHeight: 500 },
                gap: [0, 0],
            });

            const snapshot = store.getSnapshot();
            expect(snapshot.layoutItems).toHaveLength(mockItems.length);
            expect(snapshot.layoutItems[0].left).toBe(0);
            expect(snapshot.layoutItems[1].left).toBe(100);
            expect(snapshot.layoutItems[2].left).toBe(200);

            expect(snapshot.layoutItems[0].top).toBe(0);
            expect(snapshot.layoutItems[1].top).toBe(0);
            expect(snapshot.layoutItems[2].top).toBe(0);
        });

        it("should apply padding to layout items", () => {
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            container.style.padding = "20px 30px 40px 50px";
            container.style.boxSizing = "content-box";

            document.body.appendChild(container);

            store.setContainer(container);

            store.setConfig({
                layoutSize: { layoutWidth: 500, layoutHeight: 500 },
                gap: [0, 0],
            });

            const snapshot = store.getSnapshot();
            expect(snapshot.layoutItems).toHaveLength(mockItems.length);

            expect(snapshot.layoutItems[0].left).toBe(50);
            expect(snapshot.layoutItems[1].left).toBe(150);
            expect(snapshot.layoutItems[2].left).toBe(250);

            expect(snapshot.layoutItems[0].top).toBe(20);
            expect(snapshot.layoutItems[1].top).toBe(20);
            expect(snapshot.layoutItems[2].top).toBe(20);

            document.body.removeChild(container);
        });
    });

    describe("getSnapshot", () => {
        it("should return current state", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot.items).toBeDefined();
            expect(snapshot.containerSize).toBeDefined();
        });

        it("returned snapshot should contain all required fields", () => {
            const snapshot = store.getSnapshot();
            expect(snapshot).toHaveProperty("items");
            expect(snapshot).toHaveProperty("renderItems");
            expect(snapshot).toHaveProperty("layoutItems");
            expect(snapshot).toHaveProperty("containerSize");
        });
    });

    describe("Subscribe", () => {
        it("should allow subscription to state changes", () => {
            const callback = () => {};
            const unsubscribe = store.subscribe(callback);
            expect(typeof unsubscribe).toBe("function");
        });

        it("should call syncLayout before batch notification", () => {
            const syncLayoutSpy = vi.spyOn(store, "_beforeBatchOrDelayNotify");
            store.batchUpdate(() => {});
            expect(syncLayoutSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("pauseUpdateItems/resumeUpdateItems", () => {
        it("should pause items update", () => {
            store.pauseUpdateItems();
            const snapshot1 = store.getSnapshot();

            store.resumeUpdateItems();
            const snapshot2 = store.getSnapshot();

            expect(snapshot1.items).toHaveLength(3);
            expect(snapshot2.items).toHaveLength(3);
        });

        it("should handle pending items on resume", () => {
            store.pauseUpdateItems();
            const newItems = [{ id: "4", name: "Item 4" }];
            store.setItems(newItems);

            let snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(3);

            store.resumeUpdateItems();
            snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(1);
            expect(snapshot.items[0].id).toBe("4");
        });

        it("should not notify when resuming without pending items", () => {
            store.pauseUpdateItems();
            const listener = vi.fn();
            store.subscribe(listener);
            store.resumeUpdateItems();
            expect(listener).not.toHaveBeenCalled();
        });

        it("should notify when resuming with pending items", () => {
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });

            store.pauseUpdateItems();
            const newItems = [{ id: "4", name: "Item 4" }];
            store.setItems(newItems);

            const listener = vi.fn();
            store.subscribe(listener);

            store.resumeUpdateItems();
            expect(listener).toHaveBeenCalledTimes(1);

            document.body.removeChild(container);
        });
    });

    describe("setConfig", () => {
        it("should accept new configuration", () => {
            const config: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(config);
            expect(store.getConfig()).toEqual(config);
        });

        it("should not notify if config is identical", () => {
            const config: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(config);

            const listener = vi.fn();
            store.subscribe(listener);

            // Set the same config again
            store.setConfig({ ...config });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not re-layout if containerTrigger is 'width' and layoutWidth does not change", () => {
            mockAlgorithm.containerTrigger = "width";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.width = "500px";
            store.setContainer(container);

            const initialConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(initialConfig);

            const listener = vi.fn();
            store.subscribe(listener);

            const newConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 500 },
                gap: [10, 20],
            };
            store.setConfig(newConfig);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not re-layout if containerTrigger is 'height' and layoutHeight does not change", () => {
            mockAlgorithm.containerTrigger = "height";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.height = "400px";
            store.setContainer(container);

            const initialConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(initialConfig);

            const listener = vi.fn();
            store.subscribe(listener);

            const newConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 600, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(newConfig);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should re-layout if gap changes", () => {
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "400px";
            document.body.appendChild(container);
            store.setContainer(container);

            const initialConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(initialConfig);

            const listener = vi.fn();
            store.subscribe(listener);

            const newConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 30],
            };
            store.setConfig(newConfig);
            expect(store.getConfig().gap).toEqual([10, 30]);
            expect(listener).toHaveBeenCalledTimes(1);

            document.body.removeChild(container);
        });

        it("should re-layout if containerTrigger dimension changes", () => {
            mockAlgorithm.containerTrigger = "both";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "400px";
            document.body.appendChild(container);
            store.setContainer(container);

            const initialConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 500, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(initialConfig);

            const listener = vi.fn();
            store.subscribe(listener);

            const newConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 600, layoutHeight: 400 },
                gap: [10, 20],
            };
            store.setConfig(newConfig);
            expect(listener).toHaveBeenCalledTimes(1);

            const newConfig2: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 600, layoutHeight: 500 },
                gap: [10, 20],
            };
            store.setConfig(newConfig2);
            expect(listener).toHaveBeenCalledTimes(2);

            document.body.removeChild(container);
        });
    });

    describe("setLayoutAlgorithm", () => {
        it("should set new layout algorithm", () => {
            const newAlgorithm = new MockLayoutAlgorithm();
            store.setLayoutAlgorithm(newAlgorithm);
            expect(store.getLayoutAlgorithm()).toBe(newAlgorithm);
        });

        it("should ignore identical algorithm", () => {
            const original = store.getLayoutAlgorithm();

            const listener = vi.fn();
            store.subscribe(listener);

            store.setLayoutAlgorithm(original);
            expect(store.getLayoutAlgorithm()).toBe(original);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should trigger relayout when a new algorithm is set", () => {
            const newAlgorithm = new MockLayoutAlgorithm("height", "width");
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });

            const snapshotBefore = store.getSnapshot();
            expect(snapshotBefore.layoutItems).toHaveLength(mockItems.length);

            const listener = vi.fn();
            store.subscribe(listener);
            store.setLayoutAlgorithm(newAlgorithm);
            expect(store.getLayoutAlgorithm()).toBe(newAlgorithm);
            expect(listener).toHaveBeenCalledTimes(1);

            document.body.removeChild(container);
        });
    });

    describe("updateItemSize", () => {
        it("should update item size", () => {
            store.updateItemSize("1", { width: 100, height: 60 });
            const items = store.getSnapshot().items;
            const item = items.find((i) => i.id === "1");
            expect(item?.size).toEqual({ width: 100, height: 60 });
        });

        it("should ignore non-existent item", () => {
            const itemsBefore = store.getSnapshot().items;
            store.updateItemSize("999", { width: 100, height: 60 });
            const itemsAfter = store.getSnapshot().items;
            expect(itemsBefore).toEqual(itemsAfter);

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("999", { width: 100, height: 60 });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not notify if size is identical", () => {
            store.updateItemSize("1", { width: 100, height: 60 });

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("1", { width: 100, height: 60 });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not re-layout if trigger dimension does not change", () => {
            mockAlgorithm.itemTrigger = "both";
            store.updateItemSize("1", { width: 100, height: 60 });

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("1", { width: 100, height: 60 });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not re-layout if itemTrigger is 'width' and item's width does not change", () => {
            mockAlgorithm.itemTrigger = "width";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            store.updateItemSize("1", { width: 100, height: 60 });

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("1", { width: 100, height: 120 });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not re-layout if itemTrigger is 'height' and item's height does not change", () => {
            mockAlgorithm.itemTrigger = "height";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            store.updateItemSize("1", { width: 100, height: 60 });

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("1", { width: 200, height: 60 });
            expect(listener).not.toHaveBeenCalled();
        });

        it("should re-layout if itemTrigger dimension changes", () => {
            mockAlgorithm.itemTrigger = "both";
            store.setLayoutAlgorithm(mockAlgorithm);
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });
            store.updateItemSize("1", { width: 100, height: 60 });

            const listener = vi.fn();
            store.subscribe(listener);

            store.updateItemSize("1", { width: 100, height: 80 });
            expect(listener).toHaveBeenCalledTimes(1);

            store.updateItemSize("1", { width: 200, height: 80 });
            expect(listener).toHaveBeenCalledTimes(2);

            document.body.removeChild(container);
        });
    });

    describe("skipRenderIds", () => {
        it("should add skip render ID", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            store.addSkipRenderId("1");
            const snapshot = store.getSnapshot();
            expect(snapshot.renderItems.find((i) => i.data.id === "1")).toBeUndefined();
        });

        it("should not notify when adding duplicate skip render ID", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            store.addSkipRenderId("1");

            const listener = vi.fn();
            store.subscribe(listener);

            store.addSkipRenderId("1");
            expect(listener).not.toHaveBeenCalled();
        });

        it("should remove skip render ID", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            store.addSkipRenderId("1");
            store.removeSkipRenderId("1");
            const snapshot = store.getSnapshot();
            expect(snapshot.renderItems.find((i) => i.data.id === "1")).toBeDefined();
        });

        it("should not notify when removing non-existent skip render ID", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });

            const listener = vi.fn();
            store.subscribe(listener);

            store.removeSkipRenderId("999");
            expect(listener).not.toHaveBeenCalled();
        });

        it("should not notify when add non-existent skip render ID and remove", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });

            const listener = vi.fn();
            store.subscribe(listener);

            store.addSkipRenderId("999");
            store.removeSkipRenderId("999");
            expect(listener).not.toHaveBeenCalled();
        });

        it("should clear skip render IDs", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            store.addSkipRenderId("1");
            store.addSkipRenderId("2");
            store.clearSkipRenderIds();
            const snapshot = store.getSnapshot();
            expect(snapshot.renderItems).toHaveLength(3);
        });

        it("should not notify when clearing empty skip render IDs", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });

            const listener = vi.fn();
            store.subscribe(listener);

            store.clearSkipRenderIds();
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("setItems", () => {
        it("should set new items", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });

            const newItems = [{ id: "4", name: "Item 4" }];
            store.setItems(newItems);

            const snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(1);
            expect(snapshot.items[0].id).toBe("4");

            document.body.removeChild(container);
        });

        it("should not notify when items are identical", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            // Set the same items (deep equal)
            store.setItems([...mockItems]);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should notify when items changed", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            const newItems = [{ id: "4", name: "Item 4" }];
            store.setItems(newItems);
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("should store pending items when paused", () => {
            store.pauseUpdateItems();
            const newItems = [{ id: "4", name: "Item 4" }];
            store.setItems(newItems);

            // Items should not be updated yet
            const snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(3);
        });
    });

    describe("setInternalItems", () => {
        it("should set new items and update state", () => {
            const newItems = [{ id: "4", name: "Item 4" }];
            store.setInternalItems(newItems);
            const snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(1);
            expect(snapshot.items[0].id).toBe("4");
        });

        it("should not notify when items are identical", () => {
            const listener = vi.fn();
            store.subscribe(listener);

            // Set the same items (deep equal)
            store.setInternalItems([...mockItems]);
            expect(listener).not.toHaveBeenCalled();
        });

        it("should notify items even paused", () => {
            store.pauseUpdateItems();
            const listener = vi.fn();
            store.subscribe(listener);

            const newItems = [{ id: "4", name: "Item 4" }];
            store.setInternalItems(newItems);

            expect(listener).toHaveBeenCalledTimes(1);

            const snapshot = store.getSnapshot();
            expect(snapshot.items).toHaveLength(1);
        });

        it("should force notify when items change", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            const listener = vi.fn();
            store.subscribe(listener);

            const newItems = [{ id: "4", name: "Item 4" }];
            store.setInternalItems(newItems);

            expect(listener).toHaveBeenCalledTimes(1);

            document.body.removeChild(container);
        });
    });

    describe("serialize", () => {
        it("should serialize items using layout algorithm's serialize method", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            const snapshotBefore = store.getSnapshot();
            expect(snapshotBefore.layoutItems).toHaveLength(mockItems.length);

            const serialized = store.serialize();
            expect(serialized).toHaveLength(mockItems.length);
            expect(serialized[0]).toEqual({ id: mockItems[0].id, name: mockItems[0].name });
        });

        it("should serialize items", () => {
            const container = document.createElement("div");
            container.style.padding = "10px 20px";
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            const serialized = store.serialize();
            expect(serialized).toHaveLength(3);
            expect(serialized[0].id).toBe("1");
            expect(serialized[1].id).toBe("2");
            expect(serialized[2].id).toBe("3");
        });

        it("serialized data should not contain size field", () => {
            const container = document.createElement("div");
            container.style.width = "400px";
            container.style.height = "800px";
            store.setContainer(container);
            store.setConfig({
                layoutSize: { layoutWidth: 400, layoutHeight: 800 },
                gap: [12, 12] as const,
            });
            store.updateItemSize("1", { width: 100, height: 60 });
            const serialized = store.serialize();
            const item = serialized[0];
            expect(item.id).toBe("1");
            expect((item as unknown as MeasuredLayoutItem<MockLayoutItem>).size).toBeUndefined();
        });
    });

    describe("#syncLayout", () => {
        it("should return early if _isPendingNotify() is true", () => {
            const container = document.createElement("div");
            container.style.width = "500px";
            container.style.height = "500px";
            document.body.appendChild(container);
            store.setContainer(container);
            store.setConfig({ layoutSize: { layoutWidth: 500, layoutHeight: 500 }, gap: [0, 0] });

            const layoutAlgorithmSpy = vi.spyOn(mockAlgorithm, "layout");
            layoutAlgorithmSpy.mockClear();

            store.batchUpdate(() => {
                store.setItems([]);
                store.setConfig({ layoutSize: { layoutWidth: 600, layoutHeight: 500 }, gap: [0, 0] });
            });

            expect(layoutAlgorithmSpy).toHaveBeenCalledTimes(1);

            document.body.removeChild(container);
        });
    });
});
