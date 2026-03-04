import { RAFThrottle } from "../core/rafThrottle";
import type {
    BoxMetrics,
    Constraint,
    ConstraintContext,
    LayoutItem,
    PointerOffset,
    Position,
    Rectangle,
    RenderItem,
} from "../core/types";
import { getContainerBoxMetrics, getDistance, getLayoutItemFixedOffsetParent } from "../core/utils";
import type { LayoutStore } from "../store/layoutStore";

const DEFAULT_DISTANCE_THRESHOLD = 20;

export type MovingData = {
    localPosition: Position;
    fixedPosition: Position;
    globalPosition: Position;
};

export type MovingListener = (data: MovingData) => void;

export class MoveManager<T extends LayoutItem> {
    #movingListeners = new Set<MovingListener>();
    #layoutStore: LayoutStore<T>;
    #constraints: Constraint[] = [];
    #startLocalPosition: Position = {
        left: 0,
        top: 0,
    };
    #pointerOffset: PointerOffset = {
        local: { left: 0, top: 0 },
        global: { left: 0, top: 0 },
        scaleX: 1,
        scaleY: 1,
    };
    #fixedOffsetParent: { element: Element; size: BoxMetrics } | null = null;
    #container: HTMLElement | null = null;
    #containerBoxMetrics: BoxMetrics | null = null;
    #lastExchangeMovePosition: Position | null = null;
    #controller: AbortController | null = null;
    #windowRect: Rectangle = { left: 0, top: 0, width: 0, height: 0 };
    #rafThrottle = new RAFThrottle();

    constructor(layoutStore: LayoutStore<T>, constraints: Constraint[] = []) {
        this.#layoutStore = layoutStore;
        this.#constraints = constraints;
    }

    addMovingListener = (listener: MovingListener): (() => void) => {
        this.#movingListeners.add(listener);
        return () => this.#movingListeners.delete(listener);
    };

    setLayoutStore = (layoutStore: LayoutStore<T>): boolean => {
        if (!layoutStore) {
            return false;
        }
        if (this.#layoutStore === layoutStore) {
            return false;
        }
        this.#layoutStore = layoutStore;
        return true;
    };

    setContainer = (container: HTMLElement): void => {
        this.#container = container;
        this.#containerBoxMetrics = container ? getContainerBoxMetrics(container) : null;
        this.#updateWindowResize();
    };

    setConstraints = (constraints: Constraint[]): void => {
        this.#constraints = Array.isArray(constraints) ? constraints : [];
    };

    startMove = (startLocalPosition: Position, pointerOffset?: PointerOffset): void => {
        const container = this.#container;
        if (!container) {
            return;
        }
        this.#startLocalPosition = startLocalPosition;
        if (pointerOffset) {
            this.#pointerOffset = pointerOffset;
        }
        const fixedOffsetParent = getLayoutItemFixedOffsetParent(container);
        if (fixedOffsetParent) {
            this.#fixedOffsetParent = {
                element: fixedOffsetParent,
                size: getContainerBoxMetrics(fixedOffsetParent),
            };
        } else {
            this.#fixedOffsetParent = null;
        }

        this.#registerListener();
        this.#containerBoxMetrics = getContainerBoxMetrics(container);
    };

    rafMove = (
        layoutItems: RenderItem<T>[],
        movingId: string,
        pointer: Pick<PointerEvent, "clientX" | "clientY">,
    ): void => {
        this.#rafThrottle.throttle(() => {
            this.#move(layoutItems, movingId, pointer);
        });
    };

    move = (
        layoutItems: RenderItem<T>[],
        movingId: string,
        pointer: Pick<PointerEvent, "clientX" | "clientY">,
    ): boolean => {
        return this.#move(layoutItems, movingId, pointer, false);
    };

    stopMove = (): void => {
        this.#unregisterListener();
        this.#rafThrottle.cancel();
        this.#pointerOffset = {
            local: { left: 0, top: 0 },
            global: { left: 0, top: 0 },
            scaleX: 1,
            scaleY: 1,
        };
        this.#startLocalPosition = {
            left: 0,
            top: 0,
        };
        this.#fixedOffsetParent = null;
        this.#containerBoxMetrics = null;
        this.#lastExchangeMovePosition = null;
    };

    getFixedReturnPosition = (target: RenderItem<T>): Position | null => {
        const container = this.#container;
        if (!container || !this.#containerBoxMetrics) {
            return null;
        }
        if (this.#fixedOffsetParent) {
            const rect = container.getBoundingClientRect();
            const parentRect = this.#fixedOffsetParent.element.getBoundingClientRect();
            let left =
                (rect.left - parentRect.left) / this.#fixedOffsetParent.size.scaleX -
                this.#fixedOffsetParent.size.borderLeft;
            let top =
                (rect.top - parentRect.top) / this.#fixedOffsetParent.size.scaleY -
                this.#fixedOffsetParent.size.borderTop;
            left = left + this.#containerBoxMetrics.borderLeft + target.left;
            top = top + this.#containerBoxMetrics.borderTop + target.top;

            return {
                left,
                top,
            };
        } else {
            const rect = container.getBoundingClientRect();
            const left = rect.left + this.#containerBoxMetrics.borderLeft + target.left;
            const top = rect.top + this.#containerBoxMetrics.borderTop + target.top;

            return {
                left,
                top,
            };
        }
    };

    #move = (
        layoutItems: RenderItem<T>[],
        movingId: string,
        pointer: Pick<PointerEvent, "clientX" | "clientY">,
        enableThreshold: boolean = true,
    ): boolean => {
        const layoutAlgorithm = this.#layoutStore.getLayoutAlgorithm();
        const config = this.#layoutStore.getConfig();
        const container = this.#container;
        if (!container || !this.#containerBoxMetrics) {
            return false;
        }

        const currentIndex = layoutItems.findIndex((item) => item.data.id === movingId);
        const movingItem = layoutItems.find((item) => item.data.id === movingId);
        if (!movingItem) {
            return false;
        }

        const constraintContext = this.#getConstraintContext(pointer, movingItem, container, this.#containerBoxMetrics);
        const unconstrainedLocalPosition = constraintContext.localPosition;
        const localPosition = this.#applyConstraint(constraintContext);
        const constraintOffset = {
            left: unconstrainedLocalPosition.left - localPosition.left,
            top: unconstrainedLocalPosition.top - localPosition.top,
        };
        const fixedPosition = this.#getFixedDragPosition(pointer, constraintOffset);
        this.#notifyMoving({
            localPosition,
            fixedPosition,
            globalPosition: constraintContext.globalPosition,
        });

        if (enableThreshold) {
            if (this.#lastExchangeMovePosition) {
                if (this.#getDistance(this.#lastExchangeMovePosition, localPosition) < DEFAULT_DISTANCE_THRESHOLD) {
                    return false;
                }
            }
            this.#lastExchangeMovePosition = null;
        }

        const items = layoutAlgorithm.move(layoutItems, config, {
            current: movingItem,
            currentIndex,
            localPosition,
        });

        if (Array.isArray(items)) {
            this.#lastExchangeMovePosition = localPosition;
            this.#layoutStore.setInternalItems(items);
            return true;
        }

        return false;
    };

    #getDistance = (a: Position, b: Position): number => {
        return getDistance({ clientX: a.left, clientY: a.top }, { clientX: b.left, clientY: b.top });
    };

    #getFixedDragPosition = (
        pointer: Pick<PointerEvent, "clientX" | "clientY">,
        constraintOffset: Position,
    ): Position => {
        const { clientX, clientY } = pointer;
        let fixedLeft = clientX - this.#pointerOffset.global.left;
        let fixedTop = clientY - this.#pointerOffset.global.top;
        if (this.#fixedOffsetParent) {
            const parentRect = this.#fixedOffsetParent.element.getBoundingClientRect();
            fixedLeft = fixedLeft - parentRect.left - constraintOffset.left * this.#fixedOffsetParent.size.scaleX;
            fixedTop = fixedTop - parentRect.top - constraintOffset.top * this.#fixedOffsetParent.size.scaleY;
            fixedLeft = fixedLeft / this.#fixedOffsetParent.size.scaleX - this.#fixedOffsetParent.size.borderLeft;
            fixedTop = fixedTop / this.#fixedOffsetParent.size.scaleY - this.#fixedOffsetParent.size.borderTop;
        } else {
            fixedLeft = fixedLeft - constraintOffset.left;
            fixedTop = fixedTop - constraintOffset.top;
        }
        return {
            left: fixedLeft,
            top: fixedTop,
        };
    };

    #getConstraintContext = (
        pointer: Pick<PointerEvent, "clientX" | "clientY">,
        item: RenderItem<T>,
        container: HTMLElement,
        containerBoxMetrics: BoxMetrics,
    ): ConstraintContext => {
        const originRect = container.getBoundingClientRect();
        const containerLocalRect: Rectangle = {
            left: originRect.left,
            top: originRect.top,
            width: originRect.width,
            height: originRect.height,
        };
        const containerGlobalRect: Rectangle = {
            left: originRect.left,
            top: originRect.top,
            width: originRect.width,
            height: originRect.height,
        };
        const globalPosition: Position = {
            left: pointer.clientX - this.#pointerOffset.global.left,
            top: pointer.clientY - this.#pointerOffset.global.top,
        };
        const itemGlobalRect: Rectangle = {
            left: globalPosition.left,
            top: globalPosition.top,
            width: item.width,
            height: item.height,
        };
        containerLocalRect.left =
            containerLocalRect.left + containerBoxMetrics.borderLeft + containerBoxMetrics.paddingLeft;
        containerLocalRect.top =
            containerLocalRect.top + containerBoxMetrics.borderTop + containerBoxMetrics.paddingTop;
        let localLeft = pointer.clientX - originRect.left - this.#pointerOffset.global.left;
        let localTop = pointer.clientY - originRect.top - this.#pointerOffset.global.top;
        if (this.#fixedOffsetParent) {
            localLeft = localLeft / this.#fixedOffsetParent.size.scaleX - containerBoxMetrics.borderLeft;
            localTop = localTop / this.#fixedOffsetParent.size.scaleY - containerBoxMetrics.borderTop;
            containerLocalRect.width =
                originRect.width / this.#fixedOffsetParent.size.scaleX -
                containerBoxMetrics.borderLeft -
                containerBoxMetrics.borderRight -
                containerBoxMetrics.paddingLeft -
                containerBoxMetrics.paddingRight;
            containerLocalRect.height =
                originRect.height / this.#fixedOffsetParent.size.scaleY -
                containerBoxMetrics.borderTop -
                containerBoxMetrics.borderBottom -
                containerBoxMetrics.paddingTop -
                containerBoxMetrics.paddingBottom;
            itemGlobalRect.width = item.width * this.#fixedOffsetParent.size.scaleX;
            itemGlobalRect.height = item.height * this.#fixedOffsetParent.size.scaleY;
        } else {
            localLeft = localLeft - containerBoxMetrics.borderLeft;
            localTop = localTop - containerBoxMetrics.borderTop;
            containerLocalRect.width =
                originRect.width -
                containerBoxMetrics.borderLeft -
                containerBoxMetrics.borderRight -
                containerBoxMetrics.paddingLeft -
                containerBoxMetrics.paddingRight;
            containerLocalRect.height =
                originRect.height -
                containerBoxMetrics.borderTop -
                containerBoxMetrics.borderBottom -
                containerBoxMetrics.paddingTop -
                containerBoxMetrics.paddingBottom;
        }
        const itemLocalRect: Rectangle = {
            left: localLeft + containerLocalRect.left - containerBoxMetrics.paddingLeft,
            top: localTop + containerLocalRect.top - containerBoxMetrics.paddingTop,
            width: item.width,
            height: item.height,
        };

        const globalPositionToLocalPosition = (position: Position): Position => {
            let localLeft = position.left - containerGlobalRect.left;
            let localTop = position.top - containerGlobalRect.top;
            if (this.#fixedOffsetParent) {
                localLeft = localLeft / this.#fixedOffsetParent.size.scaleX - containerBoxMetrics.borderLeft;
                localTop = localTop / this.#fixedOffsetParent.size.scaleY - containerBoxMetrics.borderTop;
            } else {
                localLeft = localLeft - containerBoxMetrics.borderLeft;
                localTop = localTop - containerBoxMetrics.borderTop;
            }

            return {
                left: localLeft,
                top: localTop,
            };
        };

        const localPosition = { left: localLeft, top: localTop };
        const constraintContext: ConstraintContext = {
            item: item.data,
            startLocalPosition: { ...this.#startLocalPosition },
            localPosition,
            globalPosition,
            windowRect: this.#windowRect,
            itemLocalRect,
            itemGlobalRect,
            containerLocalRect,
            containerGlobalRect,
            pointer: { clientX: pointer.clientX, clientY: pointer.clientY },
            globalPositionToLocalPosition,
        };
        return constraintContext;
    };

    #applyConstraint = (context: ConstraintContext): Position => {
        let localPosition = context.localPosition;
        for (const constraint of this.#constraints) {
            localPosition = constraint.constrain({
                ...context,
                localPosition,
            });
        }
        return localPosition;
    };

    #updateWindowResize = (): void => {
        this.#windowRect = {
            left: 0,
            top: 0,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    };

    #registerListener = (): void => {
        this.#unregisterListener();
        this.#updateWindowResize();
        const controller = new AbortController();
        const { signal } = controller;
        window.addEventListener("resize", this.#updateWindowResize, { signal, passive: true });
        this.#controller = controller;
    };

    #unregisterListener = (): void => {
        if (this.#controller) {
            this.#controller.abort();
            this.#controller = null;
        }
    };

    #notifyMoving = (data: MovingData): void => {
        this.#movingListeners.forEach((listener) => {
            listener(data);
        });
    };
}
