import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { DropContext } from "../../context/dropContext";
import type { LayoutItem } from "../../core/types";
import { DropStore } from "../../store/dropStore";
import { useDropContext } from "../useDropContext";
import { useIsDropping, useWatchDrop } from "../useWatchDrop";

type ComponentProps = {
    dropStore: DropStore<LayoutItem>;
    children?: React.ReactNode;
};
function Component(props: ComponentProps) {
    return <DropContext.Provider value={props.dropStore}>{props.children}</DropContext.Provider>;
}

describe("useWatchDrop", () => {
    let dropStore: DropStore<LayoutItem>;

    beforeEach(() => {
        dropStore = new DropStore();
    });

    it("should rerender when drag state change", async () => {
        let renderCount = 0;
        function Child() {
            const dropStore = useDropContext<LayoutItem>();
            useWatchDrop(dropStore);
            renderCount++;

            return null;
        }

        await render(
            <Component dropStore={dropStore}>
                <Child />
            </Component>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(1);

        dropStore.setIsDropping(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);
    });

    it("should not rerender when isDropping not change", async () => {
        let renderCount = 0;
        function Child() {
            const dropStore = useDropContext<LayoutItem>();
            useIsDropping(dropStore);
            renderCount++;

            return null;
        }

        await render(
            <Component dropStore={dropStore}>
                <Child />
            </Component>,
        );

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(1);

        dropStore.setIsDropping(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);

        dropStore.setDroppingId("123");
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(renderCount).toBe(2);
    });
});
