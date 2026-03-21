import { useState } from "react";
import type { ILayoutStore, LayoutAlgorithm, LayoutItem } from "../core/types";
import { LayoutStore } from "../store/layoutStore";

export type LayoutInitializer<T extends LayoutItem> = () => {
    /**
     * Initial items for layout.
     */
    initialItems: T[];
    /**
     * The layout algorithm to be used.
     * You can use the built-in `createColumnLayoutAlgorithm` or `createRowLayoutAlgorithm`,
     * or provide your own custom implementation.
     */
    algorithm: LayoutAlgorithm<T>;
};

/**
 * Initializes and manages the layout state.
 * @param initializer - A function that returns the initial layout configuration,
 * including the layout algorithm and the initial items.
 * @returns A layout controller object to be passed to the DndLayout component.
 */
export function useLayout<T extends LayoutItem>(initializer: LayoutInitializer<T>): ILayoutStore<T> {
    const [store] = useState(() => {
        const { initialItems, algorithm } = initializer();
        return new LayoutStore<T>(initialItems, algorithm);
    });
    return store;
}
