import type React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { type ColumnLayoutItem, createColumnLayoutAlgorithm } from "../../algorithms/columnLayout";
import { DragContext } from "../../context/dragContext";
import { LayoutContext } from "../../context/layoutContext";
import type { LayoutItem, RenderItem } from "../../core/types";
import { DragStore } from "../../store/dragStore";
import { LayoutStore } from "../../store/layoutStore";
import { DndLayoutItem } from "../layoutItem";
import { DndStyle } from "../style";

const mockItem: RenderItem<ColumnLayoutItem> = {
    data: { id: "item-1", column: 0, columnSpan: 1, height: 100 },
    left: 0,
    top: 0,
    width: 100,
    height: 100,
};

function MockItemContent({ item }: { item: LayoutItem }) {
    return (
        <div
            data-testid={`item-content-${item.id}`}
            style={{
                height: "100%",
                background: "#d3d3d3",
                padding: 8,
                border: "1px solid #000000",
            }}
        >
            {item.id}
        </div>
    );
}

describe("DndLayoutItem Component", () => {
    let layoutStore: LayoutStore<ColumnLayoutItem>;
    let dragStore: DragStore<ColumnLayoutItem>;

    beforeEach(() => {
        const items: ColumnLayoutItem[] = [
            { id: "item-1", column: 0, columnSpan: 1, height: 100 },
            { id: "item-2", column: 1, columnSpan: 1, height: 100 },
        ];
        layoutStore = new LayoutStore(items, createColumnLayoutAlgorithm({ columns: 3 }));
        dragStore = new DragStore();
    });

    it("should render layout item with correct structure", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={mockItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const layoutItem = container.querySelector(".dnd-layout-item");
        expect(layoutItem).toBeTruthy();
        const contentWrapper = container.querySelector(".dnd-layout-item-content");
        expect(contentWrapper).toBeTruthy();
    });

    it("should render item content", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={mockItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const content = container.querySelector(`[data-testid="item-content-${mockItem.data.id}"]`);
        expect(content).toBeTruthy();
        expect(content?.textContent).toBe(mockItem.data.id);
    });

    it("should apply correct dimensions", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={mockItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();

        const styles = window.getComputedStyle(layoutItem);
        expect(styles.width).toBe("100px");
        expect(styles.height).toBe("100px");
    });

    it("should handle item with different sizes", async () => {
        const largeItem: RenderItem<ColumnLayoutItem> = {
            data: { id: "item-large", column: 0, columnSpan: 2, height: 200 },
            left: 0,
            top: 0,
            width: 250,
            height: 200,
        };

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={largeItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();

        const styles = window.getComputedStyle(layoutItem);
        expect(styles.width).toBe("250px");
        expect(styles.height).toBe("200px");
    });

    it("should apply style correctly", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={mockItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        const styles = window.getComputedStyle(layoutItem);
        expect(styles.position).toBe("absolute");
        expect(styles.touchAction).toBe("none");
        expect(styles.boxSizing).toBe("border-box");
    });

    it("should handle item with offset positioning", async () => {
        const offsetItem: RenderItem<ColumnLayoutItem> = {
            data: { id: "item-offset", column: 1, columnSpan: 1, height: 100 },
            left: 120,
            top: 50,
            width: 100,
            height: 100,
        };

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={offsetItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();
        expect(layoutItem.style.translate).toBe("120px 50px");
    });

    it("should handle dragging", async () => {
        const offsetItem: RenderItem<ColumnLayoutItem> = {
            data: { id: "item-offset", column: 1, columnSpan: 1, height: 100 },
            left: 120,
            top: 50,
            width: 100,
            height: 100,
        };

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={offsetItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        let layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();
        expect(layoutItem.style.translate).toBe("120px 50px");

        dragStore.setIsDragging(true);
        dragStore.setDraggingId("item-offset");
        await new Promise((resolve) => setTimeout(resolve, 50));
        layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();
        expect(layoutItem).toHaveClass("dnd-layout-item-dragging");
        expect(layoutItem.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
    });

    it("should handle dragging end", async () => {
        const offsetItem: RenderItem<ColumnLayoutItem> = {
            data: { id: "item-offset", column: 1, columnSpan: 1, height: 100 },
            left: 120,
            top: 50,
            width: 100,
            height: 100,
        };

        const { container } = await render(
            <>
                <DndStyle />
                <div
                    className="dnd-layout"
                    style={
                        {
                            "--dnd-layout-dragging-item-translate": "220px 150px 0",
                        } as React.CSSProperties
                    }
                >
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={offsetItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        let layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem).toBeTruthy();
        expect(layoutItem.style.translate).toBe("120px 50px");

        dragStore.setIsDragging(true);
        dragStore.setDraggingId("item-offset");
        await new Promise((resolve) => setTimeout(resolve, 50));
        layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem.style.zIndex).toBe("calc(infinity)");
        expect(getComputedStyle(layoutItem).translate).toBe("220px 150px");

        dragStore.setIsReturning(true);
        dragStore.setFixedReturnPosition({ left: 120, top: 50 });
        await new Promise((resolve) => setTimeout(resolve, 400));
        layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(getComputedStyle(layoutItem).translate).toBe("120px 50px");
        expect(layoutItem).not.toHaveClass("dnd-layout-item-dragging");
    });

    it("should end immediately when fixedReturnPosition is null", async () => {
        const offsetItem: RenderItem<ColumnLayoutItem> = {
            data: { id: "item-offset", column: 1, columnSpan: 1, height: 100 },
            left: 120,
            top: 50,
            width: 100,
            height: 100,
        };

        const { container } = await render(
            <>
                <DndStyle />
                <div
                    className="dnd-layout"
                    style={
                        {
                            "--dnd-layout-dragging-item-translate": "220px 150px 0",
                        } as React.CSSProperties
                    }
                >
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={offsetItem} itemRender={(item) => <MockItemContent item={item} />} />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        dragStore.setIsDragging(true);
        dragStore.setDraggingId("item-offset");
        await new Promise((resolve) => setTimeout(resolve, 50));
        let layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(layoutItem.style.zIndex).toBe("calc(infinity)");
        expect(getComputedStyle(layoutItem).translate).toBe("220px 150px");

        dragStore.setIsReturning(true);
        await new Promise((resolve) => setTimeout(resolve, 400));
        layoutItem = container.querySelector(".dnd-layout-item") as HTMLElement;
        expect(getComputedStyle(layoutItem).translate).toBe("120px 50px");
        expect(layoutItem).not.toHaveClass("dnd-layout-item-dragging");
    });

    it("should render multiple items correctly", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                        <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                            <DndLayoutItem item={mockItem} itemRender={(item) => <MockItemContent item={item} />} />
                            <DndLayoutItem
                                item={{
                                    data: { id: "item-2", column: 1, columnSpan: 1, height: 100 },
                                    left: 110,
                                    top: 0,
                                    width: 100,
                                    height: 100,
                                }}
                                itemRender={(item) => <MockItemContent item={item} />}
                            />
                        </DragContext.Provider>
                    </LayoutContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const items = container.querySelectorAll(".dnd-layout-item");
        expect(items.length).toBe(2);
    });
});
