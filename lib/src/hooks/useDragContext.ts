import { useContext } from "react";
import { DragContext } from "../context/dragContext";
import type { LayoutItem } from "../core/types";
import type { DragStore } from "../store/dragStore";

export function useDragContext<T extends LayoutItem>(): DragStore<T> {
    return useContext(DragContext) as unknown as DragStore<T>;
}
