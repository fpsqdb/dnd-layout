import type React from "react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { mouse } from "vitest-browser-commands/playwright";
import { render } from "vitest-browser-react";
import { createRowLayoutAlgorithm, type RowLayoutItem } from "../../algorithms/rowLayout";
import { horizontalAxisConstraint, verticalAxisConstraint } from "../../constraints/axisConstraint";
import { containerConstraint } from "../../constraints/containerConstraint";
import { windowConstraint } from "../../constraints/windowConstraint";
import type { LayoutItem } from "../../core/types";
import { useLayout } from "../../hooks/useLayout";
import { DndLayout, type DndLayoutProps } from "../layout";

const mockRowItems: RowLayoutItem[] = [
    { id: "item-1", row: 0, rowSpan: 1, width: 100 },
    { id: "item-2", row: 1, rowSpan: 1, width: 100 },
    { id: "item-3", row: 2, rowSpan: 1, width: 100 },
    { id: "item-4", row: 3, rowSpan: 2, width: 100 },
    { id: "item-5", row: 5, rowSpan: 1, width: 100 },
    { id: "item-6", row: 0, rowSpan: 3, width: 100 },
    { id: "item-7", row: 3, rowSpan: 1, width: 100 },
    { id: "item-8", row: 4, rowSpan: 1, width: 100 },
    { id: "item-9", row: 5, rowSpan: 1, width: 100 },
    { id: "item-10", row: 0, rowSpan: 1, width: 100 },
    { id: "item-11", row: 1, rowSpan: 1, width: 100 },
    { id: "item-12", row: 2, rowSpan: 1, width: 100 },
    { id: "item-13", row: 3, rowSpan: 1, width: 100 },
];

function MockRowItemRender({ item }: { item: LayoutItem }) {
    return (
        <div
            data-testid={`item-${item.id}`}
            style={{
                width: 100,
                boxSizing: "border-box",
                background: "#0070cb",
                padding: 8,
                border: "1px solid #002f4e",
            }}
        >
            {item.id}
        </div>
    );
}

type MockRowLayoutComponentProps = {
    scale?: number;
} & Partial<DndLayoutProps<RowLayoutItem>>;

function MockRowLayoutComponent(props?: MockRowLayoutComponentProps) {
    const layout = useLayout(() => {
        return {
            initialItems: mockRowItems,
            algorithm: createRowLayoutAlgorithm({ rows: 6 }),
        };
    });
    const [height, setHeight] = useState(800);

    const defaultItemRender = (item: RowLayoutItem) => {
        return <MockRowItemRender item={item} />;
    };

    const defaultDragEnterHandler = (e: React.DragEvent, id: string) => {
        if (!e.dataTransfer.types.includes("application/drag-item")) {
            return false;
        }
        const element: RowLayoutItem = {
            id,
            row: -1,
            rowSpan: 1 + Math.floor(Math.random() * 3),
            width: 100,
        };
        return element;
    };

    const defaultDropHandler = (_e: React.DragEvent, item: RowLayoutItem) => {
        return item;
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/drag-item", JSON.stringify({ id: "drop-item-1" }));
    };

    const onChangeItems = () => {
        const newItems: RowLayoutItem[] = [
            { id: "item-new-1", row: 0, rowSpan: 1, width: 100 },
            { id: "item-new-2", row: 1, rowSpan: 2, width: 100 },
        ];
        layout.setItems(newItems);
    };

    const onChangeHeight = () => {
        setHeight(620);
    };

    const onChangeRows = () => {
        layout.setLayoutAlgorithm(createRowLayoutAlgorithm({ rows: 2 }));
    };

    return (
        <div>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    role="none"
                    draggable
                    onDragStart={handleDragStart}
                    style={{
                        width: 50,
                        height: 50,
                        padding: 8,
                        background: "#aeaeae",
                        cursor: "grab",
                    }}
                >
                    drag me
                </div>
                <button type="button" data-testid="btn-change-items" onClick={onChangeItems}>
                    change items
                </button>
                <button type="button" data-testid="btn-change-width" onClick={onChangeHeight}>
                    change width
                </button>
                <button type="button" data-testid="btn-change-rows" onClick={onChangeRows}>
                    change rows
                </button>
            </div>
            <div
                style={{
                    border: "20px solid #2a8a91ff",
                    display: "flex",
                    flexDirection: "column",
                    padding: 20,
                    marginLeft: 100,
                    width: 200,
                    height,
                    scale: props?.scale,
                }}
            >
                <DndLayout
                    className="test-layout test-layout-row"
                    style={{
                        borderRadius: 10,
                        flexGrow: 1,
                        ...props?.style,
                    }}
                    layout={layout}
                    layoutConfig={props?.layoutConfig}
                    dragConfig={props?.dragConfig}
                    constraints={props?.constraints}
                    itemRender={props?.itemRender ?? defaultItemRender}
                    placeholderRender={props?.placeholderRender}
                    onLayoutChange={props?.onLayoutChange}
                    onDragEnter={props?.onDragEnter ?? defaultDragEnterHandler}
                    onDrop={props?.onDrop ?? defaultDropHandler}
                />
            </div>
        </div>
    );
}

describe("DndLayout Component with row layout", () => {
    let onLayoutChange: DndLayoutProps<RowLayoutItem>["onLayoutChange"];

    beforeEach(() => {
        onLayoutChange = vi.fn();
        mouse.up();
    });

    afterEach(() => {
        mouse.up();
    });

    it("should render the layout container with correct class", async () => {
        const { container } = await render(<MockRowLayoutComponent />);

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toBeTruthy();
        expect(layoutElement).toHaveClass("test-layout");
        expect(layoutElement).toHaveClass("test-layout-row");
        expect(layoutElement).toHaveClass("dnd-layout-row");
    });

    it("should render all items", async () => {
        const { container } = await render(<MockRowLayoutComponent />);

        await new Promise((resolve) => setTimeout(resolve, 100));

        mockRowItems.forEach((item) => {
            const itemElement = container.querySelector(`[data-testid="item-${item.id}"]`);
            expect(itemElement).toBeTruthy();
            expect(itemElement?.textContent).toContain(item.id);
        });
    });

    it("should apply custom style to layout container", async () => {
        const customStyle = { background: "red", padding: "10px" };
        const { container } = await render(<MockRowLayoutComponent style={customStyle} />);

        const layoutElement = container.querySelector(".dnd-layout");
        expect(layoutElement).toHaveStyle("background: red");
        expect(layoutElement).toHaveStyle("padding: 10px");
    });

    it("should call onLayoutChange when layout is stable", async () => {
        await render(<MockRowLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(1);
    });

    it("should update layout config when layoutConfig prop changes", async () => {
        const { container, rerender } = await render(
            <MockRowLayoutComponent layoutConfig={{ gap: [10, 10] }} onLayoutChange={onLayoutChange} />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        let itemElement = container.querySelector(`[data-layout_item_id="item-2"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("0px 135px");

        await rerender(<MockRowLayoutComponent layoutConfig={{ gap: [22, 22] }} onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onLayoutChange).toHaveBeenCalledTimes(1);

        itemElement = container.querySelector(`[data-layout_item_id="item-2"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("0px 137px");
    });

    it("should handle fit content height configuration", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                layoutConfig={{
                    containerFitContentHeight: true,
                    gap: [10, 10],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 200));

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement.style.height).toBe("800px");
    });

    it("should handle fit content width configuration", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                layoutConfig={{
                    containerFitContentWidth: true,
                    gap: [10, 10],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 200));

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement.style.width).toBe("320px");
    });

    it("should not start drag when mouse down target is not layout item", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                layoutConfig={{
                    containerFitContentWidth: true,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(400, 600);
        await mouse.down();
        await mouse.move(420, 650);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should not start drag when mouse down target has no layout_item_id", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                layoutConfig={{
                    containerFitContentWidth: true,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        delete itemElement.dataset.layout_item_id;
        await mouse.move(150, 70);
        await mouse.down();
        await mouse.move(160, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should not start drag when mouse down target's layout_item_id is not valid", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                layoutConfig={{
                    containerFitContentWidth: true,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        itemElement.dataset.layout_item_id = "invalid-id";
        await mouse.move(150, 70);
        await mouse.down();
        await mouse.move(160, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should not start drag when mouse down target is interactive content", async () => {
        function MockRowItemRender2({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid={`item-${item.id}`}
                    style={{
                        width: 100,
                        boxSizing: "border-box",
                        background: "#0070cb",
                        padding: 8,
                        border: "1px solid #002f4e",
                    }}
                >
                    {item.id}
                    <button type="button" style={{ height: 40 }}>
                        btn {item.id}
                    </button>
                </div>
            );
        }
        const { container } = await render(
            <MockRowLayoutComponent
                itemRender={(item) => <MockRowItemRender2 item={item} />}
                layoutConfig={{
                    containerFitContentWidth: true,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 70);
        await mouse.down();
        await mouse.move(160, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should not start drag when mouse down target is not in container", async () => {
        function MockRowLayoutComponent2() {
            const layout = useLayout(() => {
                return {
                    initialItems: mockRowItems,
                    algorithm: createRowLayoutAlgorithm({ rows: 6 }),
                };
            });
            const defaultItemRender = (item: RowLayoutItem) => {
                return <MockRowItemRender item={item} />;
            };

            return (
                <div
                    className="dnd-layout-item"
                    style={{
                        border: "20px solid #2a8a91ff",
                        display: "flex",
                        flexDirection: "column",
                        padding: 20,
                        marginLeft: 100,
                        width: 200,
                        height: 800,
                    }}
                >
                    <DndLayout
                        className="test-layout test-layout-row"
                        style={{
                            backgroundColor: "red",
                            flexGrow: 1,
                        }}
                        layout={layout}
                        layoutConfig={{
                            containerFitContentWidth: true,
                        }}
                        itemRender={defaultItemRender}
                    />
                </div>
            );
        }
        const { container } = await render(<MockRowLayoutComponent2 />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(400, 600);
        await mouse.down();
        await mouse.move(420, 650);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should start drag when mouse down target is layout item", async () => {
        const { container } = await render(<MockRowLayoutComponent />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        expect(layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("140px 40px 0");
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should move item to a new row", async () => {
        let newLayout: RowLayoutItem[] = [];
        const onLayoutChange = vi.fn((items) => {
            newLayout = items;
        });
        await render(<MockRowLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(150, 90);
        await mouse.move(150, 250);
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(newLayout).toEqual([
            { row: 1, rowSpan: 1, width: 100, id: "item-1" },
            { row: 2, rowSpan: 1, width: 100, id: "item-3" },
            { row: 3, rowSpan: 2, width: 100, id: "item-4" },
            { row: 5, rowSpan: 1, width: 100, id: "item-5" },
            { row: 1, rowSpan: 1, width: 100, id: "item-2" },
            { row: 3, rowSpan: 1, width: 100, id: "item-7" },
            { row: 4, rowSpan: 1, width: 100, id: "item-8" },
            { row: 5, rowSpan: 1, width: 100, id: "item-9" },
            { row: 0, rowSpan: 3, width: 100, id: "item-6" },
            { row: 3, rowSpan: 1, width: 100, id: "item-13" },
            { row: 0, rowSpan: 1, width: 100, id: "item-10" },
            { row: 1, rowSpan: 1, width: 100, id: "item-11" },
            { row: 2, rowSpan: 1, width: 100, id: "item-12" },
        ]);
    });

    it("should swap items within the same row", async () => {
        let newLayout: RowLayoutItem[] = [];
        const onLayoutChange = vi.fn((items) => {
            newLayout = items;
        });
        await render(<MockRowLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await mouse.move(350, 90);
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(newLayout).toEqual([
            { row: 1, rowSpan: 1, width: 100, id: "item-2" },
            { row: 2, rowSpan: 1, width: 100, id: "item-3" },
            { row: 3, rowSpan: 2, width: 100, id: "item-4" },
            { row: 5, rowSpan: 1, width: 100, id: "item-5" },
            { row: 0, rowSpan: 3, width: 100, id: "item-6" },
            { row: 3, rowSpan: 1, width: 100, id: "item-7" },
            { row: 4, rowSpan: 1, width: 100, id: "item-8" },
            { row: 5, rowSpan: 1, width: 100, id: "item-9" },
            { row: 0, rowSpan: 1, width: 100, id: "item-1" },
            { row: 1, rowSpan: 1, width: 100, id: "item-11" },
            { row: 2, rowSpan: 1, width: 100, id: "item-12" },
            { row: 3, rowSpan: 1, width: 100, id: "item-13" },
            { row: 0, rowSpan: 1, width: 100, id: "item-10" },
        ]);
    });

    it("should render placeholder when provided", async () => {
        function MockPlaceholder({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid="placeholder"
                    style={{
                        border: "2px dashed red",
                        background: "rgba(255, 0, 0, 0.1)",
                    }}
                >
                    Placeholder for {item.id}
                </div>
            );
        }

        const { container } = await render(
            <MockRowLayoutComponent placeholderRender={(item) => <MockPlaceholder item={item} />} />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(`[data-testid="placeholder"]`) as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should respect drag config disable", async () => {
        const { container } = await render(<MockRowLayoutComponent dragConfig={{ enable: false }} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement.style.translate).toBe("0px");
        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should handle external drag enter", async () => {
        const onDragEnter = vi.fn((_e: React.DragEvent, id: string) => {
            return {
                id,
                row: -1,
                rowSpan: 1,
                width: 100,
            } as RowLayoutItem;
        });

        const { container } = await render(<MockRowLayoutComponent onDragEnter={onDragEnter} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(20, 20);
        await mouse.down();
        await mouse.move(20, 190);
        await mouse.move(180, 190);
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onDragEnter).toHaveBeenCalledTimes(1);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dropping");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should prevent drop when onDragEnter return false", async () => {
        const onDragEnter = vi.fn((): false | RowLayoutItem => {
            return false;
        });

        const { container } = await render(<MockRowLayoutComponent onDragEnter={onDragEnter} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(20, 20);
        await mouse.down();
        await mouse.move(20, 190);
        await mouse.move(180, 190);
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onDragEnter).toHaveBeenCalledTimes(1);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dropping");
        await mouse.up();
    });

    it("should handle drop event", async () => {
        const onDrop = vi.fn((e: React.DragEvent, item: RowLayoutItem) => {
            if (!e.dataTransfer.types.includes("application/drag-item")) {
                return false;
            }
            const data: { id: string } = JSON.parse(e.dataTransfer.getData("application/drag-item"));
            return {
                ...item,
                id: data.id,
            } as RowLayoutItem;
        });

        const { container } = await render(<MockRowLayoutComponent onDrop={onDrop} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(20, 20);
        await mouse.down();
        await mouse.move(20, 190);
        await mouse.move(180, 190);
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onDrop).toHaveBeenCalledTimes(1);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(`[data-layout_item_id="drop-item-1"]`) as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dropping");
    });

    it("should update layout when items change", async () => {
        const { container } = await render(<MockRowLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        const button = container.querySelector(`[data-testid="btn-change-items"]`) as HTMLElement;
        await userEvent.click(button);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(2);
        let itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).not.toBeInTheDocument();
        itemElement = container.querySelector(`[data-layout_item_id="item-new-1"]`) as HTMLElement;
        expect(itemElement).toBeInTheDocument();
    });

    it("should update layout when rows change", async () => {
        const { container } = await render(<MockRowLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        const button = container.querySelector(`[data-testid="btn-change-rows"]`) as HTMLElement;
        await userEvent.click(button);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(2);
        const itemElement = container.querySelector(`[data-layout_item_id="item-3"]`) as HTMLElement;
        expect(itemElement).toBeInTheDocument();
        expect(itemElement.style.translate).toBe("112px");
    });

    it("should handle container constraint", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    border: "20px solid red",
                    padding: 30,
                }}
                constraints={[containerConstraint()]}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(200, 100);
        await mouse.down();
        await mouse.move(230, 140);
        await mouse.move(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        expect(layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("190px 90px 0");
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle window constraint", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    border: "20px solid red",
                    padding: 30,
                }}
                constraints={[windowConstraint()]}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(200, 100);
        await mouse.down();
        await mouse.move(230, 140);
        await mouse.move(-100, -100);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        expect(layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate")).toBe("0px 0px 0");
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle horizontal axis constraint", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    border: "20px solid red",
                    padding: 30,
                }}
                constraints={[horizontalAxisConstraint()]}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(200, 100);
        await mouse.down();
        await mouse.move(230, 140);
        await mouse.move(-50, -100);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        const translate = layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate");
        const values = translate.split(" ");
        expect(parseFloat(values[0])).toBeCloseTo(-90);
        expect(parseFloat(values[1])).toBeCloseTo(90);
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle vertical axis constraint", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    border: "20px solid red",
                    padding: 30,
                }}
                constraints={[verticalAxisConstraint()]}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(200, 100);
        await mouse.down();
        await mouse.move(230, 140);
        await mouse.move(-50, -20);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        const translate = layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate");
        const values = translate.split(" ");
        expect(parseFloat(values[0])).toBeCloseTo(190);
        expect(parseFloat(values[1])).toBeCloseTo(-70);
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle container constraint with container scale", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    scale: 0.5,
                    transformOrigin: "top left",
                }}
                constraints={[containerConstraint()]}
                layoutConfig={{
                    gap: [16, 16],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(170, 60);
        await mouse.move(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        const translate = layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate");
        const values = translate.split(" ");
        expect(parseFloat(values[0])).toBeCloseTo(0);
        expect(parseFloat(values[1])).toBeCloseTo(0);
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle container border and padding", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    border: "20px solid red",
                    padding: 30,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        let itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement.style.translate).toBe("30px 30px");

        await mouse.move(200, 100);
        await mouse.down();
        await mouse.move(230, 140);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        const translate = layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate");
        const values = translate.split(" ");
        expect(parseFloat(values[0])).toBeCloseTo(190);
        expect(parseFloat(values[1])).toBeCloseTo(90);
        itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should handle container resize", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                onLayoutChange={onLayoutChange}
                layoutConfig={{
                    gap: [10, 10],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        const button = container.querySelector(`[data-testid="btn-change-width"]`) as HTMLElement;
        await userEvent.click(button);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(1);
        const itemElement = container.querySelector(`[data-layout_item_id="item-2"]`) as HTMLElement;
        expect(itemElement).toBeInTheDocument();
        expect(itemElement.style.translate).toBe("0px 105px");
    });

    it("should handle container scale", async () => {
        const { container } = await render(
            <MockRowLayoutComponent
                style={{
                    scale: 0.5,
                    transformOrigin: "top left",
                }}
                layoutConfig={{
                    gap: [16, 16],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(170, 60);
        await mouse.move(200, 100);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        const translate = layoutElement.style.getPropertyValue("--dnd-layout-dragging-item-translate");
        const values = translate.split(" ");
        expect(parseFloat(values[0])).toBeCloseTo(60);
        expect(parseFloat(values[1])).toBeCloseTo(80);
        const itemElement = container.querySelector(`[data-layout_item_id="item-1"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("var(--dnd-layout-dragging-item-translate)");
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));
    });

    it("should render with draggable selector config", async () => {
        function MockItemWithHandle({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid={`item-${item.id}`}
                    style={{
                        height: 100,
                        background: "#009790",
                        padding: 8,
                        border: "1px solid #000000",
                    }}
                >
                    <div
                        className="drag-handle"
                        style={{
                            height: 20,
                            backgroundColor: "#ffffff",
                            cursor: "grab",
                        }}
                    >
                        Drag me
                    </div>
                    <div>{item.id}</div>
                </div>
            );
        }

        const { container } = await render(
            <MockRowLayoutComponent
                itemRender={(item) => <MockItemWithHandle item={item} />}
                dragConfig={{
                    draggableSelector: ".drag-handle",
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await new Promise((resolve) => setTimeout(resolve, 100));

        let placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeInTheDocument();
        let layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toHaveClass("dnd-layout-dragging");
        await mouse.up();

        await new Promise((resolve) => setTimeout(resolve, 400));
        await mouse.move(150, 120);
        await mouse.down();
        await mouse.move(180, 140);
        await new Promise((resolve) => setTimeout(resolve, 100));

        placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should auto scroll", async () => {
        function MockItemWithLargeWidth({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid={`item-${item.id}`}
                    style={{
                        width: 400,
                        background: "#009790",
                        padding: 8,
                        border: "1px solid #000000",
                    }}
                >
                    <div>{item.id}</div>
                </div>
            );
        }

        await render(
            <MockRowLayoutComponent
                onLayoutChange={onLayoutChange}
                itemRender={(item) => <MockItemWithLargeWidth item={item} />}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(onLayoutChange).toHaveBeenCalledTimes(2);
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await mouse.move(1000, 1000);
        await new Promise((resolve) => setTimeout(resolve, 400));
        await mouse.up();

        expect(window.scrollX).toBeGreaterThan(0);
    });
});
