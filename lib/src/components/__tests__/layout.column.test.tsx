import type React from "react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { mouse } from "vitest-browser-commands/playwright";
import { render } from "vitest-browser-react";
import { type ColumnLayoutItem, createColumnLayoutAlgorithm } from "../../algorithms/columnLayout";
import { horizontalAxisConstraint, verticalAxisConstraint } from "../../constraints/axisConstraint";
import { containerConstraint } from "../../constraints/containerConstraint";
import { windowConstraint } from "../../constraints/windowConstraint";
import type { LayoutItem } from "../../core/types";
import { useLayout } from "../../hooks/useLayout";
import { DndLayout, type DndLayoutProps } from "../layout";

const mockColumnItems: ColumnLayoutItem[] = [
    { id: "item-1", column: 0, columnSpan: 1, height: 100 },
    { id: "item-2", column: 1, columnSpan: 1, height: 100 },
    { id: "item-3", column: 2, columnSpan: 1, height: 100 },
    { id: "item-4", column: 3, columnSpan: 2, height: 100 },
    { id: "item-5", column: 5, columnSpan: 1, height: 100 },
    { id: "item-6", column: 0, columnSpan: 3, height: 100 },
    { id: "item-7", column: 3, columnSpan: 1, height: 100 },
    { id: "item-8", column: 4, columnSpan: 1, height: 100 },
    { id: "item-9", column: 5, columnSpan: 1, height: 100 },
    { id: "item-10", column: 0, columnSpan: 1, height: 100 },
    { id: "item-11", column: 1, columnSpan: 1, height: 100 },
    { id: "item-12", column: 2, columnSpan: 1, height: 100 },
    { id: "item-13", column: 3, columnSpan: 1, height: 100 },
];

function MockColumnItemRender({ item }: { item: LayoutItem }) {
    return (
        <div
            data-testid={`item-${item.id}`}
            style={{
                height: 100,
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

type MockColumnLayoutComponentProps = {
    scale?: number;
} & Partial<DndLayoutProps<ColumnLayoutItem>>;

function MockColumnLayoutComponent(props?: MockColumnLayoutComponentProps) {
    const layout1 = useLayout(() => {
        return {
            initialItems: mockColumnItems,
            algorithm: createColumnLayoutAlgorithm({ columns: 6 }),
        };
    });
    const layout2 = useLayout(() => {
        return {
            initialItems: mockColumnItems,
            algorithm: createColumnLayoutAlgorithm({ columns: 3 }),
        };
    });
    const [layout, setLayout] = useState(layout1);
    const [width, setWidth] = useState(800);

    const defaultItemRender = (item: ColumnLayoutItem) => {
        return <MockColumnItemRender item={item} />;
    };

    const defaultDragEnterHandler = (e: React.DragEvent, id: string) => {
        if (!e.dataTransfer.types.includes("application/drag-item")) {
            return false;
        }
        const element: ColumnLayoutItem = {
            id,
            column: -1,
            columnSpan: 1 + Math.floor(Math.random() * 3),
            height: 100,
        };
        return element;
    };

    const defaultDropHandler = (_e: React.DragEvent, item: ColumnLayoutItem) => {
        return item;
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/drag-item", JSON.stringify({ id: "drop-item-1" }));
    };

    const onChangeItems = () => {
        const newItems: ColumnLayoutItem[] = [
            { id: "item-new-1", column: 0, columnSpan: 1, height: 100 },
            { id: "item-new-2", column: 1, columnSpan: 2, height: 100 },
        ];
        layout.setItems(newItems);
    };

    const onChangeWidth = () => {
        setWidth(620);
    };

    const onChangeColumns = () => {
        layout.setLayoutAlgorithm(createColumnLayoutAlgorithm({ columns: 2 }));
    };

    const onChangeLayout = () => {
        setLayout(layout2);
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
                <button type="button" data-testid="btn-change-width" onClick={onChangeWidth}>
                    change width
                </button>
                <button type="button" data-testid="btn-change-columns" onClick={onChangeColumns}>
                    change columns
                </button>
                <button type="button" data-testid="btn-change-layout" onClick={onChangeLayout}>
                    change layout
                </button>
            </div>
            <div
                style={{
                    border: "20px solid #2a8a91ff",
                    padding: 20,
                    marginLeft: 100,
                    width,
                    height: 200,
                    scale: props?.scale,
                }}
            >
                <DndLayout
                    className="test-layout test-layout-column"
                    style={{
                        borderRadius: 10,
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

describe("DndLayout Component with column layout", () => {
    let onLayoutChange: DndLayoutProps<ColumnLayoutItem>["onLayoutChange"];

    beforeEach(() => {
        onLayoutChange = vi.fn();
        mouse.up();
    });

    afterEach(() => {
        mouse.up();
    });

    it("should render the layout container with correct class", async () => {
        const { container } = await render(<MockColumnLayoutComponent />);

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).toBeTruthy();
        expect(layoutElement).toHaveClass("test-layout");
        expect(layoutElement).toHaveClass("test-layout-column");
        expect(layoutElement).toHaveClass("dnd-layout-column");
    });

    it("should render all items", async () => {
        const { container } = await render(<MockColumnLayoutComponent />);

        await new Promise((resolve) => setTimeout(resolve, 100));

        mockColumnItems.forEach((item) => {
            const itemElement = container.querySelector(`[data-testid="item-${item.id}"]`);
            expect(itemElement).toBeTruthy();
            expect(itemElement?.textContent).toContain(item.id);
        });
    });

    it("should apply custom style to layout container", async () => {
        const customStyle = { background: "red", padding: "10px" };
        const { container } = await render(<MockColumnLayoutComponent style={customStyle} />);

        const layoutElement = container.querySelector(".dnd-layout");
        expect(layoutElement).toHaveStyle("background: red");
        expect(layoutElement).toHaveStyle("padding: 10px");
    });

    it("should call onLayoutChange when layout is stable", async () => {
        await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(1);
    });

    it("should update layout config when layoutConfig prop changes", async () => {
        const { container, rerender } = await render(
            <MockColumnLayoutComponent layoutConfig={{ gap: [10, 10] }} onLayoutChange={onLayoutChange} />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        let itemElement = container.querySelector(`[data-layout_item_id="item-2"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("135px");

        await rerender(<MockColumnLayoutComponent layoutConfig={{ gap: [22, 22] }} onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(onLayoutChange).toHaveBeenCalledTimes(1);

        itemElement = container.querySelector(`[data-layout_item_id="item-2"]`) as HTMLElement;
        expect(itemElement).toBeTruthy();
        expect(itemElement.style.translate).toBe("137px");
    });

    it("should handle fit content height configuration", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
                layoutConfig={{
                    containerFitContentHeight: true,
                    gap: [10, 10],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 200));

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement.style.height).toBe("320px");
    });

    it("should handle fit content width configuration", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
                layoutConfig={{
                    containerFitContentWidth: true,
                    gap: [10, 10],
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 200));

        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement.style.width).toBe("800px");
    });

    it("should not start drag when mouse down target is not layout item", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
                layoutConfig={{
                    containerFitContentHeight: true,
                }}
            />,
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(850, 280);
        await mouse.down();
        await mouse.move(880, 300);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should not start drag when mouse down target has no layout_item_id", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
                layoutConfig={{
                    containerFitContentHeight: true,
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
            <MockColumnLayoutComponent
                layoutConfig={{
                    containerFitContentHeight: true,
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
        function MockColumnItemRender2({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid={`item-${item.id}`}
                    style={{
                        height: 100,
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
            <MockColumnLayoutComponent
                itemRender={(item) => <MockColumnItemRender2 item={item} />}
                layoutConfig={{
                    containerFitContentHeight: true,
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
        function MockColumnLayoutComponent2() {
            const layout = useLayout(() => {
                return {
                    initialItems: mockColumnItems,
                    algorithm: createColumnLayoutAlgorithm({ columns: 6 }),
                };
            });
            const defaultItemRender = (item: ColumnLayoutItem) => {
                return <MockColumnItemRender item={item} />;
            };

            return (
                <div
                    className="dnd-layout-item"
                    style={{
                        border: "20px solid #2a8a91ff",
                        padding: 20,
                        marginLeft: 100,
                        width: 800,
                        height: 200,
                    }}
                >
                    <DndLayout
                        className="test-layout test-layout-column"
                        style={{
                            backgroundColor: "red",
                        }}
                        layout={layout}
                        layoutConfig={{
                            containerFitContentHeight: true,
                        }}
                        itemRender={defaultItemRender}
                    />
                </div>
            );
        }
        const { container } = await render(<MockColumnLayoutComponent2 />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(850, 280);
        await mouse.down();
        await mouse.move(880, 300);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).not.toBeInTheDocument();
        const layoutElement = container.querySelector(".dnd-layout") as HTMLElement;
        expect(layoutElement).not.toHaveClass("dnd-layout-dragging");
        await mouse.up();
    });

    it("should start drag when mouse down target is layout item", async () => {
        const { container } = await render(<MockColumnLayoutComponent />);

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

    it("should move item to a new column", async () => {
        let newLayout: ColumnLayoutItem[] = [];
        const onLayoutChange = vi.fn((items) => {
            newLayout = items;
        });
        await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await mouse.move(300, 90);
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(newLayout).toEqual([
            { column: 1, columnSpan: 1, height: 100, id: "item-1" },
            { column: 2, columnSpan: 1, height: 100, id: "item-3" },
            { column: 3, columnSpan: 2, height: 100, id: "item-4" },
            { column: 5, columnSpan: 1, height: 100, id: "item-5" },
            { column: 1, columnSpan: 1, height: 100, id: "item-2" },
            { column: 3, columnSpan: 1, height: 100, id: "item-7" },
            { column: 4, columnSpan: 1, height: 100, id: "item-8" },
            { column: 5, columnSpan: 1, height: 100, id: "item-9" },
            { column: 0, columnSpan: 3, height: 100, id: "item-6" },
            { column: 3, columnSpan: 1, height: 100, id: "item-13" },
            { column: 0, columnSpan: 1, height: 100, id: "item-10" },
            { column: 1, columnSpan: 1, height: 100, id: "item-11" },
            { column: 2, columnSpan: 1, height: 100, id: "item-12" },
        ]);
    });

    it("should swap items within the same column", async () => {
        let newLayout: ColumnLayoutItem[] = [];
        const onLayoutChange = vi.fn((items) => {
            newLayout = items;
        });
        await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        await mouse.move(150, 50);
        await mouse.down();
        await mouse.move(180, 90);
        await mouse.move(180, 230);
        await mouse.up();
        await new Promise((resolve) => setTimeout(resolve, 400));

        expect(newLayout).toEqual([
            { column: 1, columnSpan: 1, height: 100, id: "item-2" },
            { column: 2, columnSpan: 1, height: 100, id: "item-3" },
            { column: 3, columnSpan: 2, height: 100, id: "item-4" },
            { column: 5, columnSpan: 1, height: 100, id: "item-5" },
            { column: 0, columnSpan: 3, height: 100, id: "item-6" },
            { column: 3, columnSpan: 1, height: 100, id: "item-7" },
            { column: 4, columnSpan: 1, height: 100, id: "item-8" },
            { column: 5, columnSpan: 1, height: 100, id: "item-9" },
            { column: 0, columnSpan: 1, height: 100, id: "item-1" },
            { column: 1, columnSpan: 1, height: 100, id: "item-11" },
            { column: 2, columnSpan: 1, height: 100, id: "item-12" },
            { column: 3, columnSpan: 1, height: 100, id: "item-13" },
            { column: 0, columnSpan: 1, height: 100, id: "item-10" },
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
            <MockColumnLayoutComponent placeholderRender={(item) => <MockPlaceholder item={item} />} />,
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
        const { container } = await render(<MockColumnLayoutComponent dragConfig={{ enable: false }} />);

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
                column: -1,
                columnSpan: 1,
                height: 100,
            } as ColumnLayoutItem;
        });

        const { container } = await render(<MockColumnLayoutComponent onDragEnter={onDragEnter} />);

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
        const onDragEnter = vi.fn((): false | ColumnLayoutItem => {
            return false;
        });

        const { container } = await render(<MockColumnLayoutComponent onDragEnter={onDragEnter} />);

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
        const onDrop = vi.fn((e: React.DragEvent, item: ColumnLayoutItem) => {
            if (!e.dataTransfer.types.includes("application/drag-item")) {
                return false;
            }
            const data: { id: string } = JSON.parse(e.dataTransfer.getData("application/drag-item"));
            return {
                ...item,
                id: data.id,
            } as ColumnLayoutItem;
        });

        const { container } = await render(<MockColumnLayoutComponent onDrop={onDrop} />);

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
        const { container } = await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

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

    it("should update layout when columns change", async () => {
        const { container } = await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        const button = container.querySelector(`[data-testid="btn-change-columns"]`) as HTMLElement;
        await userEvent.click(button);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(2);
        const itemElement = container.querySelector(`[data-layout_item_id="item-3"]`) as HTMLElement;
        expect(itemElement).toBeInTheDocument();
        expect(itemElement.style.translate).toBe("0px 112px");
    });

    it("should update layout when layout change", async () => {
        const { container } = await render(<MockColumnLayoutComponent onLayoutChange={onLayoutChange} />);

        await new Promise((resolve) => setTimeout(resolve, 100));
        const button = container.querySelector(`[data-testid="btn-change-layout"]`) as HTMLElement;
        await userEvent.click(button);

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(onLayoutChange).toHaveBeenCalledTimes(2);
        const itemElement = container.querySelector(`[data-layout_item_id="item-4"]`) as HTMLElement;
        expect(itemElement).toBeInTheDocument();
        expect(itemElement.style.translate).toBe("0px 112px");
    });

    it("should handle container constraint", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
        expect(itemElement.style.translate).toBe("105px");
    });

    it("should handle container scale", async () => {
        const { container } = await render(
            <MockColumnLayoutComponent
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
            <MockColumnLayoutComponent
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
        function MockItemWidthLargeHeight({ item }: { item: LayoutItem }) {
            return (
                <div
                    data-testid={`item-${item.id}`}
                    style={{
                        height: 400,
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
            <MockColumnLayoutComponent
                onLayoutChange={onLayoutChange}
                itemRender={(item) => <MockItemWidthLargeHeight item={item} />}
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

        expect(window.scrollY).toBeGreaterThan(0);
    });
});
