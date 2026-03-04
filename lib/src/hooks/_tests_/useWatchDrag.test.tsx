import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { DragContext } from "../../context/dragContext";
import type { LayoutItem } from "../../core/types";
import { DragStore } from "../../store/dragStore";
import { useDragContext } from "../useDragContext";
import { useIsDragging, useWatchDrag } from "../useWatchDrag";

type ComponentProps = {
    dragStore: DragStore<LayoutItem>;
    children?: React.ReactNode;
};
function Component(props: ComponentProps) {
    return <DragContext.Provider value={props.dragStore}>{props.children}</DragContext.Provider>;
}

describe("useWatchDrag", () => {
    let dragStore: DragStore<LayoutItem>;

    beforeEach(() => {
        dragStore = new DragStore();
    });

    it("should rerender when drag state change", async () => {
        let renderCount = 0;
        function Child() {
            const dragStore = useDragContext<LayoutItem>();
            useWatchDrag(dragStore);
            renderCount++;

            return null;
        }

        await render(
            <Component dragStore={dragStore}>
                <Child />
            </Component>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(1);

        dragStore.setIsDragging(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);
    });

    it("should not rerender when isDragging not change", async () => {
        let renderCount = 0;
        function Child() {
            const dragStore = useDragContext<LayoutItem>();
            useIsDragging(dragStore);
            renderCount++;

            return null;
        }

        await render(
            <Component dragStore={dragStore}>
                <Child />
            </Component>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(1);

        dragStore.setIsDragging(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);

        dragStore.setDraggingId("123");
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);
    });
});
