import { useContext } from "react";
import { DropContext } from "../context/dropContext";
import type { LayoutItem } from "../core/types";
import type { DropStore } from "../store/dropStore";

export function useDropContext<T extends LayoutItem>(): DropStore<T> {
    return useContext(DropContext) as unknown as DropStore<T>;
}
