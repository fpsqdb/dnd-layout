import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import type { ColumnLayoutItem } from "../../algorithms/columnLayout";
import { DragContext } from "../../context/dragContext";
import { DropContext } from "../../context/dropContext";
import type { LayoutItem, RenderItem } from "../../core/types";
import { DragStore } from "../../store/dragStore";
import { DropStore } from "../../store/dropStore";
import { Placeholder } from "../placeholder";
import { DndStyle } from "../style";

function MockPlaceholderContent({ item }: { item: LayoutItem }) {
    return (
        <div
            data-testid={`placeholder-content-${item.id}`}
            style={{
                border: "2px dashed red",
                background: "rgba(255, 0, 0, 0.1)",
                height: "100%",
            }}
        >
            Placeholder: {item.id}
        </div>
    );
}

describe("Placeholder Component", () => {
    let dropStore: DropStore<ColumnLayoutItem>;
    let dragStore: DragStore<ColumnLayoutItem>;

    beforeEach(() => {
        dropStore = new DropStore();
        dragStore = new DragStore();
    });

    it("should not render when there is no placeholder", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder");
        expect(placeholder).toBeFalsy();
    });

    it("should render placeholder when it exists", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-1", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 100,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder");
        expect(placeholder).toBeTruthy();
    });

    it("should apply correct positioning to placeholder", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-pos", column: -1, columnSpan: 1, height: 100 },
            left: 50,
            top: 150,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        const styles = window.getComputedStyle(placeholder);
        expect(styles.position).toBe("absolute");
        expect(styles.top).toBe("0px");
        expect(styles.left).toBe("0px");
    });

    it("should apply correct dimensions to placeholder", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-size", column: -1, columnSpan: 2, height: 200 },
            left: 0,
            top: 0,
            width: 250,
            height: 200,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        const styles = window.getComputedStyle(placeholder);
        expect(styles.width).toBe("250px");
        expect(styles.height).toBe("200px");
    });

    it("should render default placeholder content when no render function is provided", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-default", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const defaultContent = container.querySelector(".dnd-layout-placeholder-default-content");
        expect(defaultContent).toBeTruthy();
    });

    it("should render custom placeholder content when render function is provided", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-custom", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem>
                                placeholderRender={(item) => <MockPlaceholderContent item={item} />}
                            />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const customContent = container.querySelector(`[data-testid="placeholder-content-placeholder-custom"]`);
        expect(customContent).toBeTruthy();
        expect(customContent?.textContent).toContain("Placeholder: placeholder-custom");
    });

    it("should apply default placeholder styles", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-style", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const defaultContent = container.querySelector(".dnd-layout-placeholder-default-content") as HTMLElement;
        expect(defaultContent).toBeTruthy();

        const styles = window.getComputedStyle(defaultContent);
        expect(styles.width).toBe("100px");
        expect(styles.height).toBe("100px");
    });

    it("should apply translate transform to placeholder", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-transform", column: -1, columnSpan: 1, height: 100 },
            left: 100,
            top: 200,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        // Check inline style
        expect(placeholder.style.translate).toContain("100px");
        expect(placeholder.style.translate).toContain("200px");
    });

    it("should handle placeholder with zero dimensions", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-zero", column: -1, columnSpan: 1, height: 0 },
            left: 0,
            top: 0,
            width: 0,
            height: 0,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        const styles = window.getComputedStyle(placeholder);
        expect(styles.width).toBe("0px");
        expect(styles.height).toBe("0px");
    });

    it("should handle placeholder with large dimensions", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-large", column: -1, columnSpan: 3, height: 500 },
            left: 0,
            top: 0,
            width: 1000,
            height: 500,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        const styles = window.getComputedStyle(placeholder);
        expect(styles.width).toBe("1000px");
        expect(styles.height).toBe("500px");
    });

    it("should update placeholder when placeholder data changes", async () => {
        const initialPlaceholder: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-1", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(initialPlaceholder);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const updatedPlaceholder: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-2", column: -1, columnSpan: 2, height: 150 },
            left: 50,
            top: 100,
            width: 200,
            height: 150,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(updatedPlaceholder);

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        const styles = window.getComputedStyle(placeholder);
        expect(styles.width).toBe("200px");
        expect(styles.height).toBe("150px");
    });

    it("should disappear when placeholder is cleared", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-disappear", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        let placeholder = container.querySelector(".dnd-layout-placeholder");
        expect(placeholder).toBeTruthy();

        // Clear the placeholder
        dropStore.reset();

        await new Promise((resolve) => setTimeout(resolve, 50));

        placeholder = container.querySelector(".dnd-layout-placeholder");
        expect(placeholder).toBeFalsy();
    });

    it("should apply box-sizing: border-box", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder", column: -1, columnSpan: 1, height: 100 },
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const defaultContent = container.querySelector(".dnd-layout-placeholder-default-content") as HTMLElement;
        const styles = window.getComputedStyle(defaultContent);
        expect(styles.boxSizing).toBe("border-box");
    });

    it("should handle placeholder with negative position", async () => {
        const placeholderData: RenderItem<ColumnLayoutItem> = {
            data: { id: "placeholder-negative", column: -1, columnSpan: 1, height: 100 },
            left: -50,
            top: -100,
            width: 100,
            height: 100,
        };

        dropStore.setIsDropping(true);
        dropStore.setPlaceholder(placeholderData);

        const { container } = await render(
            <>
                <DndStyle />
                <div className="dnd-layout">
                    <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                        <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                            <Placeholder<ColumnLayoutItem> />
                        </DropContext.Provider>
                    </DragContext.Provider>
                </div>
            </>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));

        const placeholder = container.querySelector(".dnd-layout-placeholder") as HTMLElement;
        expect(placeholder).toBeTruthy();

        expect(placeholder.style.translate).toContain("-50px");
        expect(placeholder.style.translate).toContain("-100px");
    });
});
