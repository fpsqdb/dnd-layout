import { useCallback } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import type { LayoutItem } from "../core/types";
import type { DropStore, DropStoreValue } from "../store/dropStore";

export function useWatchDrop<T extends LayoutItem>(dropStore: DropStore<T>): DropStoreValue<T>;
export function useWatchDrop<T extends LayoutItem, R = DropStoreValue<T>>(
    dropStore: DropStore<T>,
    selector: (value: DropStoreValue<T>) => R,
    isEqual?: (pre: R, next: R) => boolean,
): R;
export function useWatchDrop(
    dropStore: DropStore<LayoutItem>,
    selector?: (value: DropStoreValue<LayoutItem>) => unknown,
    isEqual?: (pre: unknown, next: unknown) => boolean,
): unknown {
    const defaultSelector = useCallback((store: DropStoreValue<LayoutItem>) => store, []);
    const storeValue = useSyncExternalStoreWithSelector(
        dropStore.subscribe,
        dropStore.getSnapshot,
        dropStore.getSnapshot,
        selector ?? defaultSelector,
        isEqual,
    );

    return storeValue;
}

export function useIsDropping<T extends LayoutItem>(dropStore: DropStore<T>): boolean {
    const selectIsDropping = useCallback((s: DropStoreValue<T>) => s.isDropping, []);
    return useWatchDrop(dropStore, selectIsDropping);
}
