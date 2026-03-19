import type { LayoutConfig, LayoutRenderConfig } from "./types";

export const DRAGGING_ITEM_TRANSLATE_CSS_VAR = "--dnd-layout-dragging-item-translate";

export const DEFAULT_LAYOUT_GAP: [number, number] = [12, 12];

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
    gap: DEFAULT_LAYOUT_GAP,
};

export const DEFAULT_LAYOUT_RENDER_CONFIG: LayoutRenderConfig = {
    layoutSize: {
        layoutWidth: 0,
        layoutHeight: 0,
    },
    gap: DEFAULT_LAYOUT_GAP,
};
