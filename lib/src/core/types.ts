/**
 * Represents the dimensions of an element.
 */
export type Size = {
    /**
     * Width in pixels.
     */
    width: number;
    /**
     * Height in pixels.
     */
    height: number;
};

/**
 * Represents a rectangular area, typically used for bounding boxes.
 */
export type Rectangle = {
    /**
     * The x-coordinate (left) relative to the reference container.
     */
    left: number;
    /**
     * The y-coordinate (top) relative to the reference container.
     */
    top: number;
    /**
     * The width of the rectangle.
     */
    width: number;
    /**
     * The height of the rectangle.
     */
    height: number;
};

/**
 * The available size within the container for layout purposes.
 */
export type LayoutSize = {
    /**
     * The available width of the container.
     */
    layoutWidth: number;
    /**
     * The available height of the container.
     */
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
    /**
     * The x-coordinate (left) relative to the reference container.
     */
    left: number;
    /**
     * The y-coordinate (top) relative to the reference container.
     */
    top: number;
    /**
     * The width of the item.
     */
    width: number;
    /**
     * The height of the item.
     */
    height: number;
    /**
     * LayoutItem
     */
    data: T;
};

/**
 * Represents the 2D coordinates (x-coordinate: left, y-coordinate: top).
 */
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

/**
 * Options to enable boundary constraints for specific sides of a container or window.
 * When set to true, the dragged item will be prevented from moving beyond that boundary.
 */
export type BoundedConstraintOption = {
    /**
     * Enable constraint on the top edge, default: true.
     */
    top?: boolean;
    /**
     * Enable constraint on the right edge, default: true.
     */
    right?: boolean;
    /**
     * Enable constraint on the bottom edge, default: true.
     */
    bottom?: boolean;
    /**
     * Enable constraint on the left edge, default: true.
     */
    left?: boolean;
};

export type ConstraintContext = {
    /**
     * The item currently being dragged
     */
    item: LayoutItem;
    /**
     * Initial position of the dragged item relative to the container at the start of the drag.
     */
    startLocalPosition: Position;
    /**
     * The position of the currently dragged item relative to its container.
     */
    localPosition: Position;
    /**
     * The current position of the dragged item relative to the viewport.
     */
    globalPosition: Position;
    /**
     * The bounding box of the current viewport.
     */
    windowRect: Rectangle;
    /**
     * The bounding box of the current item relative to its container,
     * ignoring any scaling applied to the container or parent elements.
     */
    itemLocalRect: Rectangle;
    /**
     * The bounding box of the current item relative to the viewport.
     */
    itemGlobalRect: Rectangle;
    /**
     * The bounding box of the container relative to the viewport,
     * ignoring any scaling applied to the container or parent elements.
     */
    containerLocalRect: Rectangle;
    /**
     * The bounding box of the container relative to the viewport.
     */
    containerGlobalRect: Rectangle;
    /**
     * The current position of the pointer.
     */
    pointer: Pick<PointerEvent, "clientX" | "clientY">;
    /**
     * Converts a global position to container-local coordinates.
     * @param globalPosition A position relative to the viewport.
     * @returns
     */
    globalPositionToLocalPosition: (globalPosition: Position) => Position;
};

export interface Constraint {
    /**
     * Returns the constrained local position.
     * @param context
     * @returns The position of the currently dragged item relative to its container.
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
    /**
     * The position of the currently dragged item relative to its container.
     */
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
     * @param layoutAlgorithm The layout algorithm to be used.
     * @returns
     */
    setLayoutAlgorithm: (layoutAlgorithm: LayoutAlgorithm<T>) => void;
    /**
     * Replaces current item list.
     * @param items Layout items.
     * @returns
     */
    setItems: (items: T[]) => void;
}
