import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DragContext } from "../context/dragContext";
import { DropContext } from "../context/dropContext";
import { LayoutContext } from "../context/layoutContext";
import { cls } from "../core/cls";
import { DEFAULT_LAYOUT_CONFIG } from "../core/constants";
import type { Constraint, DragConfig, ILayoutStore, LayoutConfig, LayoutItem } from "../core/types";
import { getContainerBoxMetrics, getPointerOffset, getRenderConfig, isDeepEqual } from "../core/utils";
import { useIsDragging } from "../hooks/useWatchDrag";
import { useIsDropping } from "../hooks/useWatchDrop";
import { useWatchLayout } from "../hooks/useWatchLayout";
import { DragManager } from "../manager/dragManager";
import { DropManager } from "../manager/dropManager";
import { DragStore } from "../store/dragStore";
import { DropStore } from "../store/dropStore";
import type { LayoutStore } from "../store/layoutStore";
import { DndLayoutItem } from "./layoutItem";
import { Placeholder } from "./placeholder";
import { DndStyle } from "./style";

export type DndLayoutProps<T extends LayoutItem> = {
    /**
     * Layout store instance created by `useLayout`, used to update layout. 
     */
    layout: ILayoutStore<T>;
    /**
     * Layout render options (e.g. `gap`, fit container width/height to content).
     */
    layoutConfig?: LayoutConfig;
    /**
     * Drag behavior config. Set `enable=false` to disable dragging; use `draggableSelector` as a drag handle filter.
     */
    dragConfig?: DragConfig;
    /**
     * Drag constraints applied during movement to clamp/adjust positions.
     */
    constraints?: Constraint[];
    /**
     * Renders a single item node.
     * @param item 
     * @returns 
     */
    itemRender: (item: T) => React.ReactNode;
    /**
     * Custom placeholder renderer shown while dragging or external dropping. 
     * @param item 
     * @returns 
     */
    placeholderRender?: (item: T) => React.ReactNode;
    /**
     * Called after layout changes.
     * @param items Returns serialized items
     * @returns 
     */
    onLayoutChange?: (items: T[]) => void;
    /**
     * Called when external drag enters the container. Return a `T` to accept/insert a temporary item, or `false` to reject. 
     * @param event 
     * @param id 
     * @returns 
     */
    onDragEnter?: (event: React.DragEvent, id: string) => T | false;
    /**
     * Called when external drop happens. Return final `T` to confirm, or `false` to cancel and remove the temporary item.
     * @param event 
     * @param item 
     * @returns 
     */
    onDrop?: (event: React.DragEvent, item: T) => T | false;
    /**
     * Class name for the root container.
     */
    className?: string;
    /**
     * Style for the root container.
     */
    style?: React.CSSProperties;
};

export function DndLayout<T extends LayoutItem>(props: DndLayoutProps<T>) {
    const {
        layout,
        layoutConfig,
        dragConfig,
        constraints,
        itemRender,
        placeholderRender,
        onLayoutChange,
        onDragEnter,
        onDrop,
        style,
        className,
    } = props;
    const layoutStore = layout as LayoutStore<T>;
    const enableExternalDrag = Boolean(onDragEnter);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragStore] = useState(() => new DragStore<T>());
    const [dropStore] = useState(() => new DropStore<T>());
    const layoutStoreRef = useRef(layoutStore);
    const layoutConfigRef = useRef(layoutConfig);
    const onLayoutChangeRef = useRef(onLayoutChange);
    const previousNotifyItemsRef = useRef<T[]>([]);
    const { renderItems, layoutItems, containerSize } = useWatchLayout(layoutStore);
    const [dragManager] = useState(() => {
        return new DragManager<T>(layoutStore, dragStore, constraints ?? []);
    });
    const [dropManager] = useState(() => {
        return new DropManager<T>(layoutStore, dropStore);
    });
    const isDragging = useIsDragging(dragStore);
    const isDropping = useIsDropping(dropStore);

    const updateConfig = () => {
        const container = containerRef.current;
        /* v8 ignore if -- @preserve */
        if (!container) {
            return;
        }
        const containerBoxMetrics = getContainerBoxMetrics(container);
        const renderConfig = getRenderConfig(layoutConfigRef.current ?? DEFAULT_LAYOUT_CONFIG, {
            layoutHeight: containerBoxMetrics.layoutHeight,
            layoutWidth: containerBoxMetrics.layoutWidth,
        });
        layoutStoreRef.current.setConfig(renderConfig);
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useLayoutEffect(() => {
        const container = containerRef.current;
        /* v8 ignore if -- @preserve */
        if (!container) {
            return;
        }
        layoutStore.setContainer(container);
        dragManager.setContainer(container);
        dropManager.setContainer(container);
        updateConfig();
    }, []);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useLayoutEffect(() => {
        const container = containerRef.current;
        /* v8 ignore if -- @preserve */
        if (!container) {
            return;
        }
        updateConfig();
        const observer = new ResizeObserver(() => {
            updateConfig();
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        layoutStoreRef.current = layoutStore;
        const container = containerRef.current;
        /* v8 ignore if -- @preserve */
        if (!container) {
            return;
        }
        layoutStore.setContainer(container);
    }, [layoutStore]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useEffect(() => {
        updateConfig();
        dragManager.setLayoutStore(layoutStore);
        dropManager.setLayoutStore(layoutStore);
        dragManager.subscribeLayoutStore();
        dropManager.subscribeLayoutStore();
        return () => {
            dragManager.unsubscribeLayoutStore();
            dropManager.unsubscribeLayoutStore();
        };
    }, [layoutStore]);

    useEffect(() => {
        onLayoutChangeRef.current = onLayoutChange;
    }, [onLayoutChange]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useEffect(() => {
        if (isDragging) {
            return;
        }
        if (isDropping) {
            return;
        }
        const newItems = layoutStoreRef.current.serialize();
        if (isDeepEqual(newItems, previousNotifyItemsRef.current)) {
            return;
        }
        previousNotifyItemsRef.current = newItems;
        if (onLayoutChangeRef.current) {
            onLayoutChangeRef.current(newItems);
        }
    }, [layoutItems, isDragging, isDropping]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useEffect(() => {
        layoutConfigRef.current = layoutConfig;
        updateConfig();
    }, [layoutConfig]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useEffect(() => {
        dragManager.setConstraints(constraints ?? []);
    }, [constraints]);

    const getStyle = (): React.CSSProperties => {
        const sizeStyle: React.CSSProperties = {};
        if (renderItems.length > 0) {
            if (layoutConfig?.containerFitContentHeight === true) {
                sizeStyle.height = containerSize.height;
            }
            if (layoutConfig?.containerFitContentWidth === true) {
                sizeStyle.width = containerSize.width;
            }
        }
        return {
            ...style,
            ...sizeStyle,
        };
    };

    const onPointerDown = (e: React.PointerEvent) => {
        if (dragConfig?.enable === false) {
            return;
        }
        const container = containerRef.current;
        /* v8 ignore if -- @preserve */
        if (!container) {
            return;
        }
        /* v8 ignore if -- @preserve */
        if (!(e.target instanceof Element)) {
            return;
        }
        const draggableSelector = dragConfig?.draggableSelector;
        if (typeof draggableSelector === "string" && draggableSelector) {
            if (!e.target.closest(draggableSelector)) {
                return;
            }
        } else {
            const ignoredSelector = `input, button, select, textarea, [contenteditable="true"]`;
            if (e.target.closest(ignoredSelector)) {
                return;
            }
        }

        const itemRoot = e.target.closest(".dnd-layout-item");
        if (!itemRoot || !(itemRoot instanceof HTMLElement)) {
            return;
        }
        if (!container.contains(itemRoot)) {
            return;
        }
        const { layout_item_id } = itemRoot.dataset;
        if (typeof layout_item_id !== "string") {
            return;
        }
        const item = renderItems.find((item) => item.data.id === layout_item_id);
        if (!item) {
            return;
        }
        e.preventDefault();
        dragManager.handleInternalDragStart(e, {
            draggingId: layout_item_id,
            pointerOffset: getPointerOffset(itemRoot, e),
        });
    };

    const onExternalDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dropManager.handleExternalDragEnter(e, onDragEnter);
    };

    const onExternalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDropping) {
            e.dataTransfer.dropEffect = "none";
        }
        dropManager.handleExternalDragOver(e);
    };

    const onExternalDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
            dropManager.handleExternalDragLeave();
        }
    };

    const onExternalDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dropManager.handleExternalDrop(e, onDrop);
    };

    return (
        <>
            <DndStyle />
            <LayoutContext.Provider value={layoutStore as unknown as LayoutStore<LayoutItem>}>
                <DragContext.Provider value={dragStore as unknown as DragStore<LayoutItem>}>
                    <DropContext.Provider value={dropStore as unknown as DropStore<LayoutItem>}>
                        <div
                            role="none"
                            className={cls(
                                "dnd-layout",
                                className,
                                layoutStore.getLayoutAlgorithm().className,
                                { "dnd-layout-dragging": isDragging },
                                { "dnd-layout-dropping": isDropping },
                            )}
                            style={getStyle()}
                            ref={containerRef}
                            onPointerDown={onPointerDown}
                            onDragEnter={enableExternalDrag ? onExternalDragEnter : undefined}
                            onDragOver={enableExternalDrag ? onExternalDragOver : undefined}
                            onDragLeave={enableExternalDrag ? onExternalDragLeave : undefined}
                            onDrop={enableExternalDrag ? onExternalDrop : undefined}
                        >
                            <Placeholder placeholderRender={placeholderRender} />
                            {renderItems.map((item) => (
                                <DndLayoutItem key={item.data.id} item={item} itemRender={itemRender} />
                            ))}
                        </div>
                    </DropContext.Provider>
                </DragContext.Provider>
            </LayoutContext.Provider>
        </>
    );
}
