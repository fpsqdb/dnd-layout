import { AutoScroller } from "../core/autoScroller";
import { DRAGGING_ITEM_TRANSLATE_CSS_VAR } from "../core/constants";
import type { Constraint, LayoutItem, PointerOffset, Position, RenderItem } from "../core/types";
import { getDistance, getScrollParent } from "../core/utils";
import type { DragStore } from "../store/dragStore";
import type { LayoutStore } from "../store/layoutStore";
import { MoveManager } from "./moveManager";

export type DragData = {
    draggingId: string;
    pointerOffset: PointerOffset;
};

type DragItemData = {
    startLocalPosition: Position;
} & DragData;

type DragState =
    | {
          isDragging: false;
          target: DragItemData | null;
      }
    | {
          isDragging: true;
          target: DragItemData;
      };

export type DragManagerUpdateCallback<T extends LayoutItem> = (items: T[]) => void;

const DEFAULT_MOUSE_DRAG_THRESHOLD = 5;
const DEFAULT_TOUCH_DRAG_THRESHOLD = 10;

export class DragManager<T extends LayoutItem> {
    #layoutStore: LayoutStore<T>;
    #unsubscribeLayoutStore: (() => void) | null = null;
    #dragStore: DragStore<T>;
    #dragState: DragState = { isDragging: false, target: null };
    #dragThreshold = DEFAULT_MOUSE_DRAG_THRESHOLD;
    #isThresholdCustomized = false;
    #startPointerPosition: Pick<PointerEvent, "clientX" | "clientY"> = { clientX: 0, clientY: 0 };
    #latestPointerPosition: Pick<PointerEvent, "clientX" | "clientY"> = { clientX: 0, clientY: 0 };
    #layoutItems: RenderItem<T>[] = [];
    #container: HTMLElement | null = null;
    #autoScroller: AutoScroller;
    #moveManager: MoveManager<T>;
    #controller: AbortController | null = null;

    constructor(layoutStore: LayoutStore<T>, dragStore: DragStore<T>, constraints: Constraint[]) {
        this.#layoutStore = layoutStore;
        this.#layoutItems = layoutStore.getSnapshot().layoutItems;
        this.#dragStore = dragStore;
        this.#autoScroller = new AutoScroller({}, () => {
            /* v8 ignore else -- @preserve */
            if (this.#dragState.isDragging) {
                this.#rafMove(this.#dragState.target.draggingId);
            }
        });
        this.#moveManager = new MoveManager(layoutStore, constraints);
        this.#moveManager.addMovingListener((data) => {
            /* v8 ignore else -- @preserve */
            if (this.#dragState.isDragging) {
                this.#updateDragPositionCssVar(data.fixedPosition);
                if (!this.#dragStore.getSnapshot().isDragging) {
                    this.#startInternalDrag(this.#dragState.target.draggingId);
                }
            }
        });
    }

    subscribeLayoutStore = () => {
        this.unsubscribeLayoutStore();
        const syncFromLayoutStore = () => {
            this.#layoutItems = this.#layoutStore.getSnapshot().layoutItems;
            const dragState = this.#dragState;
            if (dragState.isDragging) {
                const targetItem = this.#layoutItems.find((item) => item.data.id === dragState.target.draggingId);
                this.#dragStore.setPlaceholder(targetItem);
            }
        };
        syncFromLayoutStore();
        this.#unsubscribeLayoutStore = this.#layoutStore.subscribe(syncFromLayoutStore);
    };

    unsubscribeLayoutStore = () => {
        this.#unsubscribeLayoutStore?.();
    };

    setLayoutStore = (layoutStore: LayoutStore<T>) => {
        if (!layoutStore) {
            return false;
        }
        if (this.#layoutStore === layoutStore) {
            return false;
        }
        this.#layoutStore = layoutStore;
        this.#layoutItems = layoutStore.getSnapshot().layoutItems;
        if (this.#dragState.isDragging) {
            this.#layoutStore.pauseUpdateItems();
        }
        this.#moveManager.setLayoutStore(layoutStore);
        return true;
    };

    setContainer = (container: HTMLElement) => {
        this.#container = container;
        this.#autoScroller.setTarget(getScrollParent(container));
        this.#moveManager.setContainer(container);
    };

    setConstraints = (constraints: Constraint[]) => {
        this.#moveManager.setConstraints(constraints);
    };

    setThreshold = (threshold: number) => {
        this.#dragThreshold = Math.max(0, threshold);
        this.#isThresholdCustomized = true;
    };

    handleInternalDragStart = (e: Pick<PointerEvent, "clientX" | "clientY" | "pointerType">, data: DragData) => {
        if (this.#dragState.isDragging) {
            this.#handleInternalDragEnd();
            return;
        }
        const { draggingId, pointerOffset } = data;
        const item = this.#layoutItems.find((item) => item.data.id === draggingId);
        if (!item) {
            return;
        }
        const { clientX, clientY, pointerType } = e;
        if (!this.#isThresholdCustomized) {
            this.#dragThreshold = this.#getAutoThreshold(pointerType);
        }

        this.#dragState = {
            isDragging: this.#dragThreshold === 0,
            target: {
                draggingId,
                pointerOffset,
                startLocalPosition: { left: item.left, top: item.top },
            },
        };
        this.#startPointerPosition = { clientX, clientY };

        if (this.#dragState.isDragging) {
            this.#moveManager.startMove(this.#dragState.target.startLocalPosition, pointerOffset.global);
        }
        this.#registerListener();
    };

    #handleInternalDragMove = (e: PointerEvent) => {
        const { clientX, clientY } = e;
        this.#latestPointerPosition = { clientX, clientY };
        const draggingItemData = this.#dragState.target;
        /* v8 ignore if -- @preserve */
        if (!draggingItemData) {
            // This should never happen.
            return;
        }

        if (!this.#dragState.isDragging) {
            if (getDistance(e, this.#startPointerPosition) >= this.#dragThreshold) {
                this.#dragState = {
                    isDragging: true,
                    target: draggingItemData,
                };
                this.#moveManager.startMove(
                    draggingItemData.startLocalPosition,
                    this.#getGlobalPointerOffsetWithDragThreshold(e, draggingItemData.pointerOffset),
                );
            } else {
                return;
            }
        }

        this.#autoScroller.update(e);
        this.#rafMove(draggingItemData.draggingId);
    };

    #handleInternalDragEnd = () => {
        this.#unregisterListener();
        this.#autoScroller.stop();
        this.#layoutStore.resumeUpdateItems();
        const dragState = this.#dragState;
        if (dragState.isDragging) {
            const draggingItem = this.#layoutItems.find((item) => item.data.id === dragState.target.draggingId);
            if (draggingItem) {
                const fixedReturnPosition = this.#moveManager.getFixedReturnPosition(draggingItem);
                if (fixedReturnPosition) {
                    this.#dragStore.batchUpdate(() => {
                        this.#dragStore.setIsReturning(true);
                        this.#dragStore.setFixedReturnPosition(fixedReturnPosition);
                    });
                } else {
                    // This should never happen.
                    this.#dragStore.reset();
                }
            } else {
                // This should never happen.
                this.#dragStore.reset();
            }
        }

        this.#moveManager.stopMove();
        this.#dragState = { isDragging: false, target: null };
    };

    #registerListener = () => {
        this.#unregisterListener();
        const controller = new AbortController();
        const { signal } = controller;
        window.addEventListener("pointermove", this.#handleInternalDragMove, { signal, passive: true });
        window.addEventListener("pointerup", this.#handleInternalDragEnd, { signal });
        window.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape") {
                    this.#handleInternalDragEnd();
                }
            },
            { signal },
        );
        this.#controller = controller;
    };

    #unregisterListener = () => {
        if (this.#controller) {
            this.#controller.abort();
            this.#controller = null;
        }
    };

    #getAutoThreshold = (pointerType: string) => {
        if (pointerType === "touch") {
            return DEFAULT_TOUCH_DRAG_THRESHOLD;
        }
        return DEFAULT_MOUSE_DRAG_THRESHOLD;
    };

    #startInternalDrag = (draggingId: string) => {
        const targetItem = this.#layoutItems.find((item) => item.data.id === draggingId);
        this.#dragStore.batchUpdate(() => {
            this.#dragStore.setIsDragging(true);
            this.#dragStore.setDraggingId(draggingId);
            this.#dragStore.setPlaceholder(targetItem);
        });
        this.#layoutStore.pauseUpdateItems();
    };

    #updateDragPositionCssVar = (fixedPosition: Position) => {
        const container = this.#container;
        /* v8 ignore if -- @preserve */
        if (!container) {
            // This should never happen.
            return;
        }
        container.style.setProperty(
            DRAGGING_ITEM_TRANSLATE_CSS_VAR,
            `${fixedPosition.left}px ${fixedPosition.top}px 0`,
        );
    };

    #getGlobalPointerOffsetWithDragThreshold = (e: PointerEvent, pointerOffset: PointerOffset): Position => {
        return {
            left: pointerOffset.global.left + (e.clientX - this.#startPointerPosition.clientX),
            top: pointerOffset.global.top + (e.clientY - this.#startPointerPosition.clientY),
        };
    };

    #rafMove = (draggingId: string) => {
        this.#moveManager.rafMove(this.#layoutItems, draggingId, this.#latestPointerPosition);
    };
}
