export type Size = {
    width: number;
    height: number;
};

export type Rectangle = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export type LayoutSize = {
    layoutWidth: number;
    layoutHeight: number;
};

export type LayoutItem = {
    /**
     * Unique and stable item identifier used for rendering.
     */
    id: string;
};

export type MeasuredLayoutItem<T extends LayoutItem> = {
    /**
     * Runtime measured size, if available.
     */
    size?: Size;
} & T;

export type RenderItem<T extends LayoutItem> = {
    left: number;
    top: number;
    width: number;
    height: number;
    data: T;
};

export type Position = Pick<RenderItem<LayoutItem>, "left" | "top">;

export type BoxMetrics = {
    borderTop: number;
    borderRight: number;
    borderBottom: number;
    borderLeft: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    boxSizing: string;
    height: number;
    width: number;
    layoutWidth: number;
    layoutHeight: number;
    scaleX: number;
    scaleY: number;
};

export type PointerOffset = {
    local: Position;
    global: Position;
    scaleX: number;
    scaleY: number;
};

export type LayoutConfig = {
    /**
     * Item gap: uniform number or `[horizontal, vertical]`.
     */
    gap?: number | [horizontal: number, vertical: number];
};

export type DragConfig = {
    /**
     * Enable/disable dragging. Default: true.
     */
    enable?: boolean;
    /**
     * CSS selector that defines valid drag handles.
     */
    draggableSelector?: string;
};

export type LayoutRenderConfig = {
    layoutSize: LayoutSize;
    gap: [horizontal: number, vertical: number];
};

export type BoundedConstraintOption = {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
};

export type ConstraintContext = {
    item: LayoutItem;
    startLocalPosition: Position;
    localPosition: Position;
    globalPosition: Position;
    windowRect: Rectangle;
    itemLocalRect: Rectangle;
    itemGlobalRect: Rectangle;
    containerLocalRect: Rectangle;
    containerGlobalRect: Rectangle;
    pointer: Pick<PointerEvent, "clientX" | "clientY">;
    /**
     * Converts a global position to container-local coordinates.
     * @param globalPosition
     * @returns
     */
    globalPositionToLocalPosition: (globalPosition: Position) => Position;
};

export interface Constraint {
    /**
     * Returns the constrained local position.
     * @param context
     * @returns
     */
    constrain: (context: ConstraintContext) => Position;
}

export type MoveContext<T extends LayoutItem> = {
    /**
     * Currently dragged render item.
     */
    current: RenderItem<T>;
    /**
     * Index of `current` in the render list.
     */
    currentIndex: number;
    localPosition: Position;
};

/**
 * Which dimension changes should trigger relayout.
 */
export type RelayoutTrigger = "width" | "height" | "both";

/**
 * How the container should fit its content size.
 * - `"width"`: Container adjusts to fit content width
 * - `"height"`: Container adjusts to fit content height
 * - `"both"`: Container adjusts to fit both width and height
 * - `"none"`: Container does not adjust to fit content
 */
export type ContentFitMode = "width" | "height" | "both" | "none";

export interface LayoutAlgorithm<T extends LayoutItem> {
    /**
     * Class name applied to layout root for algorithm-specific styles.
     */
    readonly className?: string;
    /**
     * Container resize trigger dimension(s).
     */
    readonly containerTrigger: RelayoutTrigger;
    /**
     * Item resize trigger dimension(s).
     */
    readonly itemTrigger: RelayoutTrigger;
    /**
     * How the container should fit its content size.
     */
    readonly contentFitMode: ContentFitMode;
    /**
     * Computes positioned render items from source items and config.
     * @param items
     * @param config
     * @returns
     */
    layout: (items: MeasuredLayoutItem<T>[], config: LayoutRenderConfig) => RenderItem<MeasuredLayoutItem<T>>[];
    /**
     * Computes reordered items while moving; return `false` for no change.
     * @param items
     * @param config
     * @param context
     * @returns
     */
    move: (
        items: RenderItem<MeasuredLayoutItem<T>>[],
        config: LayoutRenderConfig,
        context: MoveContext<MeasuredLayoutItem<T>>,
    ) => MeasuredLayoutItem<T>[] | false;
    /**
     * Serializes a render item.
     * @param item
     * @returns
     */
    serialize: (item: RenderItem<MeasuredLayoutItem<T>>) => T;
}

export interface ILayoutStore<T extends LayoutItem> {
    /**
     * Replaces current layout algorithm.
     * @param layoutAlgorithm
     * @returns
     */
    setLayoutAlgorithm: (layoutAlgorithm: LayoutAlgorithm<T>) => void;
    /**
     * Replaces current item list.
     * @param items
     * @returns
     */
    setItems: (items: T[]) => void;
}
