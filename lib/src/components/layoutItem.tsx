import type React from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { cls } from "../core/cls";
import { DRAGGING_ITEM_TRANSLATE_CSS_VAR } from "../core/constants";
import type { LayoutItem, RenderItem } from "../core/types";
import { isFirefox } from "../core/utils";
import { useDragContext } from "../hooks/useDragContext";
import { useLayoutContext } from "../hooks/useLayoutContext";
import { useWatchDrag } from "../hooks/useWatchDrag";
import type { DragStoreValue } from "../store/dragStore";

export type DragItemData<T extends LayoutItem> = {
    item: T;
    itemRect: DOMRect;
};

export type DndLayoutItemProps<T extends LayoutItem> = {
    item: RenderItem<T>;
    itemRender: (item: T) => React.ReactNode;
};

export function DndLayoutItem<T extends LayoutItem>(props: DndLayoutItemProps<T>) {
    const { item, itemRender } = props;
    const layoutItemId = item.data.id;

    const rootRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const layoutStore = useLayoutContext<T>();
    const dragStore = useDragContext<T>();

    const selectDraggingState = useCallback((s: DragStoreValue<T>) => s, []);
    const draggingStateIsEquals = useCallback(
        (pre: DragStoreValue<T>, next: DragStoreValue<T>) => {
            if (pre.draggingId !== layoutItemId && next.draggingId !== layoutItemId) {
                return true;
            }
            return pre === next;
        },
        [layoutItemId],
    );
    const draggingState = useWatchDrag<T>(dragStore, selectDraggingState, draggingStateIsEquals);

    const isDragging = draggingState.isDragging && draggingState.draggingId === layoutItemId;

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useLayoutEffect(() => {
        if (draggingState.isReturning) {
            const stopDrag = () => {
                dragStore.reset();
                layoutStore.resumeUpdateItems();
            };
            const animateAndStop = async () => {
                const root = rootRef.current;
                /* v8 ignore if -- @preserve */
                if (!root) {
                    stopDrag();
                    return;
                }
                const fixedReturnPosition = draggingState.fixedReturnPosition;
                if (!fixedReturnPosition) {
                    stopDrag();
                    return;
                }
                const animation = root.animate(
                    {
                        translate: `${fixedReturnPosition.left}px ${fixedReturnPosition.top}px 0`,
                    },
                    {
                        duration: 200,
                        easing: "ease-out",
                        fill: "forwards",
                    },
                );
                await animation.finished;
                animation.cancel();
                stopDrag();

                /* v8 ignore if -- @preserve */
                if (isFirefox()) {
                    /**
                     * FIX: Prevents "position jump" in Firefox.
                     *
                     * We must update the CSS properties (position & translate) and force a
                     * synchronous layout flush (via offsetWidth) BEFORE canceling the animation.
                     *
                     * This ensures the CSS layer is perfectly aligned with the animation's end
                     * state, preventing the element from snapping back to its initial fixed
                     * coordinates when the animation layer is removed.
                     */
                    root.style.position = "absolute";
                    root.style.translate = `${item.left}px ${item.top}px 0`;
                    void root.offsetWidth;
                }
            };
            animateAndStop();
        }
    }, [draggingState.isReturning]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: *
    useLayoutEffect(() => {
        const content = contentRef.current;
        /* v8 ignore if -- @preserve */
        if (!content) {
            return;
        }
        layoutStore.delayUpdate(() => {
            layoutStore.updateItemSize(layoutItemId, {
                height: content.offsetHeight,
                width: content.offsetWidth,
            });
        });
        const observer = new ResizeObserver(() => {
            layoutStore.updateItemSize(layoutItemId, {
                height: content.offsetHeight,
                width: content.offsetWidth,
            });
        });
        observer.observe(content);
        return () => {
            observer.disconnect();
        };
    }, [layoutItemId]);

    const getStyle = (): React.CSSProperties => {
        const commonStyle: React.CSSProperties = {
            left: 0,
            top: 0,
            height: item.height,
            width: item.width,
        };
        if (isDragging) {
            commonStyle.position = "fixed";
            commonStyle.zIndex = "calc(infinity)";
            commonStyle.translate = `var(${DRAGGING_ITEM_TRANSLATE_CSS_VAR})`;
        } else {
            commonStyle.position = "absolute";
            commonStyle.translate = `${item.left}px ${item.top}px 0`;
        }
        return commonStyle;
    };

    return (
        <div
            className={cls("dnd-layout-item", {
                "dnd-layout-item-dragging": isDragging,
            })}
            ref={rootRef}
            data-layout_item_id={layoutItemId}
            style={getStyle()}
        >
            <div ref={contentRef} className="dnd-layout-item-content">
                {itemRender(item.data)}
            </div>
        </div>
    );
}
