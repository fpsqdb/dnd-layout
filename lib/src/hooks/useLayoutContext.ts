import { useContext } from "react";
import { LayoutContext } from "../context/layoutContext";
import type { LayoutItem } from "../core/types";
import type { LayoutStore } from "../store/layoutStore";

export function useLayoutContext<T extends LayoutItem>(): LayoutStore<T> {
    return useContext(LayoutContext) as unknown as LayoutStore<T>;
}
