import { createContext } from "react";
import type { LayoutItem } from "../core/types";
import type { LayoutStore } from "../store/layoutStore";

export const LayoutContext = createContext<LayoutStore<LayoutItem>>(null as unknown as LayoutStore<LayoutItem>);
