import { useCallback } from "react";
import type { LayoutItem, RenderItem } from "../core/types";
import { isDeepEqual } from "../core/utils";
import { useDragContext } from "./useDragContext";
import { useDropContext } from "./useDropContext";
import { useWatchDrag } from "./useWatchDrag";
import { useWatchDrop } from "./useWatchDrop";

export function useWatchPlaceholder<T extends LayoutItem>(): RenderItem<T> | null {
    const dragStore = useDragContext<T>();
    const dropStore = useDropContext<T>();
    const selectPlaceholder = useCallback((store: { placeholder: RenderItem<T> | null }) => store.placeholder, []);
    const dragPlaceholder = useWatchDrag(dragStore, selectPlaceholder, isDeepEqual);
    const dropPlaceholder = useWatchDrop(dropStore, selectPlaceholder, isDeepEqual);

    return dragPlaceholder || dropPlaceholder;
}
