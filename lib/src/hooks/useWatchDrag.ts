import { useCallback } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import type { LayoutItem } from "../core/types";
import type { DragStore, DragStoreValue } from "../store/dragStore";

export function useWatchDrag<T extends LayoutItem>(dragStore: DragStore<T>): DragStoreValue<T>;
export function useWatchDrag<T extends LayoutItem, R = DragStoreValue<T>>(
    dragStore: DragStore<T>,
    selector: (value: DragStoreValue<T>) => R,
    isEqual?: (pre: R, next: R) => boolean,
): R;
export function useWatchDrag(
    dragStore: DragStore<LayoutItem>,
    selector?: (value: DragStoreValue<LayoutItem>) => unknown,
    isEqual?: (pre: unknown, next: unknown) => boolean,
): unknown {
    const defaultSelector = useCallback((store: DragStoreValue<LayoutItem>) => store, []);
    const storeValue = useSyncExternalStoreWithSelector(
        dragStore.subscribe,
        dragStore.getSnapshot,
        dragStore.getSnapshot,
        selector ?? defaultSelector,
        isEqual,
    );

    return storeValue;
}

export function useIsDragging<T extends LayoutItem>(dragStore: DragStore<T>): boolean {
    const selectIsDragging = useCallback((s: DragStoreValue<T>) => s.isDragging, []);
    return useWatchDrag(dragStore, selectIsDragging);
}
