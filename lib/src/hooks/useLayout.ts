import { useState } from "react";
import type { ILayoutStore, LayoutAlgorithm, LayoutItem } from "../core/types";
import { LayoutStore } from "../store/layoutStore";

export type LayoutInitializer<T extends LayoutItem> = () => {
    initialItems: T[];
    algorithm: LayoutAlgorithm<T>;
};

export function useLayout<T extends LayoutItem>(initializer: LayoutInitializer<T>): ILayoutStore<T> {
    const [store] = useState(() => {
        const { initialItems, algorithm } = initializer();
        return new LayoutStore<T>(initialItems, algorithm);
    });
    return store;
}
