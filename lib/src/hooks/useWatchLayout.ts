import { useSyncExternalStore } from "react";
import type { LayoutItem } from "../core/types";
import type { LayoutStore } from "../store/layoutStore";

export function useWatchLayout<T extends LayoutItem>(store: LayoutStore<T>) {
    return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
