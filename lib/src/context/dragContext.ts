import { createContext } from "react";
import type { LayoutItem } from "../core/types";
import type { DragStore } from "../store/dragStore";

export const DragContext = createContext<DragStore<LayoutItem>>(null as unknown as DragStore<LayoutItem>);
