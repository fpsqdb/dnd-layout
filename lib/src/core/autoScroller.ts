import { RAFThrottle } from "./rafThrottle";
import { supportScroll } from "./utils";

const DEFAULT_SCROLL_THRESHOLD = 50;
const DEFAULT_MAX_SCROLL_SPEED = 20;

type ScrollDirection = "none" | "up" | "down" | "left" | "right";

const ScrollDirectionFactor: { [key in ScrollDirection]: number } = {
    none: 0,
    up: -1,
    down: 1,
    left: -1,
    right: 1,
} as const;

type Dimension = {
    scrollTop: number;
    scrollLeft: number;
    scrollHeight: number;
    scrollWidth: number;
    clientHeight: number;
    clientWidth: number;
    rect: Pick<DOMRect, "top" | "left" | "bottom" | "right">;
};

type ScrollContext = {
    direction: { x: ScrollDirection; y: ScrollDirection };
    intensity: { x: number; y: number };
    target: Element | Window;
};

export type AutoScrollerOptions = {
    threshold?: number;
    speed?: number;
};

export class AutoScroller {
    #scrollChain: (Element | Window)[] = [];
    #threshold: number;
    #speed: number;
    #latestPointerPosition: Pick<PointerEvent, "clientX" | "clientY"> = { clientX: 0, clientY: 0 };
    #onScroll?: () => void;
    #rafThrottle = new RAFThrottle();

    constructor(options: AutoScrollerOptions = {}, onScroll?: () => void) {
        this.#threshold = options.threshold ?? DEFAULT_SCROLL_THRESHOLD;
        this.#speed = options.speed ?? DEFAULT_MAX_SCROLL_SPEED;
        this.#onScroll = onScroll;
    }

    setTarget = (target: Element | Window): void => {
        this.#scrollChain = this.#getScrollChain(target);
    };

    update = (e: Pick<PointerEvent, "clientX" | "clientY">): void => {
        this.#latestPointerPosition = e;
        const context = this.#getScrollContext(e);

        if (context) {
            this.#autoScroll(e, context);
        } else {
            this.stop();
        }
    };

    stop = (): void => {
        this.#rafThrottle.cancel();
    };

    #autoScroll = (e: Pick<PointerEvent, "clientX" | "clientY">, context: ScrollContext): void => {
        const scrollFrame = () => {
            const scrollX = ScrollDirectionFactor[context.direction.x] * this.#speed * context.intensity.x;
            const scrollY = ScrollDirectionFactor[context.direction.y] * this.#speed * context.intensity.y;
            if (context.target === window) {
                window.scrollBy(scrollX, scrollY);
            } else {
                const el = context.target as Element;
                el.scrollTop += scrollY;
                el.scrollLeft += scrollX;
            }
            this.#onScroll?.();
        };

        this.#rafThrottle.throttle(scrollFrame, () => {
            const context = this.#getScrollContext(this.#latestPointerPosition);
            if (context) {
                this.#autoScroll(e, context);
            }
        });
    };

    #getScrollContext = (e: Pick<PointerEvent, "clientX" | "clientY">): ScrollContext | null => {
        const { clientX, clientY } = e;
        for (const target of this.#scrollChain) {
            const dimension = this.#getDimensions(target);
            const { rect } = dimension;

            const direction: { x: ScrollDirection; y: ScrollDirection } = { x: "none", y: "none" };
            const intensity = { x: 1, y: 1 };

            const topThreshold = Math.max(rect.top + this.#threshold, this.#threshold);
            const bottomThreshold = Math.min(rect.bottom - this.#threshold, window.innerHeight - this.#threshold);

            if (clientY < topThreshold) {
                direction.y = "up";
                intensity.y = Math.min(1, (topThreshold - clientY) / this.#threshold);
            } else if (clientY > bottomThreshold) {
                direction.y = "down";
                intensity.y = Math.min(1, (clientY - bottomThreshold) / this.#threshold);
            }

            const leftThreshold = Math.max(rect.left + this.#threshold, this.#threshold);
            const rightThreshold = Math.min(rect.right - this.#threshold, window.innerWidth - this.#threshold);
            if (clientX < leftThreshold) {
                direction.x = "left";
                intensity.x = Math.min(1, (leftThreshold - clientX) / this.#threshold);
            } else if (clientX > rightThreshold) {
                direction.x = "right";
                intensity.x = Math.min(1, (clientX - rightThreshold) / this.#threshold);
            }

            const canScrollX = direction.x !== "none" && !this.#isBoundary(dimension, direction.x);
            const canScrollY = direction.y !== "none" && !this.#isBoundary(dimension, direction.y);

            if (canScrollX || canScrollY) {
                return {
                    direction,
                    intensity,
                    target,
                };
            }
        }
        return null;
    };

    #getScrollChain = (startElement: Element | Window): (Element | Window)[] => {
        const chain: (Element | Window)[] = [];
        if (startElement instanceof Window) {
            chain.push(window);
            return chain;
        }
        let current: Element | null = startElement;
        while (current) {
            if (supportScroll(current)) {
                chain.push(current);
            }
            current = current.parentElement;
        }
        chain.push(window);
        return chain;
    };

    #getDimensions = (target: Element | Window): Dimension => {
        if (target instanceof Window) {
            const target = document.documentElement;
            return {
                scrollTop: window.scrollY || target.scrollTop,
                scrollLeft: window.scrollX || target.scrollLeft,
                scrollHeight: target.scrollHeight,
                scrollWidth: target.scrollWidth,
                clientHeight: window.innerHeight,
                clientWidth: window.innerWidth,
                rect: {
                    top: 0,
                    left: 0,
                    bottom: window.innerHeight,
                    right: window.innerWidth,
                },
            };
        }

        return {
            scrollTop: target.scrollTop,
            scrollLeft: target.scrollLeft,
            scrollHeight: target.scrollHeight,
            scrollWidth: target.scrollWidth,
            clientHeight: target.clientHeight,
            clientWidth: target.clientWidth,
            rect: target.getBoundingClientRect(),
        };
    };

    #isBoundary = (dimension: Dimension, direction: "up" | "down" | "left" | "right"): boolean => {
        const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = dimension;
        const offset = 1;

        if (direction === "up") {
            return scrollTop <= 0;
        } else if (direction === "down") {
            return scrollTop + clientHeight >= scrollHeight - offset;
        } else if (direction === "left") {
            return scrollLeft <= 0;
        } else {
            return scrollLeft + clientWidth >= scrollWidth - offset;
        }
    };
}
