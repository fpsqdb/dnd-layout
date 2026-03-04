import { createContext } from "react";
import type { LayoutItem } from "../core/types";
import type { DropStore } from "../store/dropStore";

export const DropContext = createContext<DropStore<LayoutItem>>(null as unknown as DropStore<LayoutItem>);
