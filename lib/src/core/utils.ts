import { DEFAULT_LAYOUT_GAP } from "./constants";
import type {
    BoxMetrics,
    LayoutConfig,
    LayoutItem,
    LayoutRenderConfig,
    LayoutSize,
    PointerOffset,
    RenderItem,
    Size,
} from "./types";

export function isFirefox() {
    return navigator.userAgent.toLowerCase().includes("firefox");
}

export function isPositiveFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function validatePositiveNumber(value: unknown, min: number = 0, defaultValue: number = 0): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= min) {
        return value;
    }
    return defaultValue;
}

export function validatePositiveInteger(value: unknown, min: number = 1, defaultValue: number = 1): number {
    if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= min) {
        return value;
    }
    return defaultValue;
}

export function validateSpan(span: unknown, maxSpan: number): number {
    if (typeof span === "number" && Number.isFinite(span)) {
        const normalized = Math.floor(span);
        if (normalized >= 1) {
            return Math.min(normalized, maxSpan);
        }
    }
    if (span === Infinity) {
        return maxSpan;
    }
    return 1;
}

export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
    if (Object.is(obj1, obj2)) {
        return true;
    }

    if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) {
        return false;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
        return false;
    }

    if (obj1 instanceof Date && obj2 instanceof Date) {
        return obj1.getTime() === obj2.getTime();
    }

    if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
        return obj1.toString() === obj2.toString();
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    for (const key of keys1) {
        if (!Object.hasOwn(obj2, key)) {
            return false;
        }
        if (!isDeepEqual(obj1[key as keyof typeof obj1], obj2[key as keyof typeof obj2])) {
            return false;
        }
    }

    return true;
}

export function getRenderConfig(layoutConfig: LayoutConfig, layoutSize: LayoutSize): LayoutRenderConfig {
    let gap: [number, number] = DEFAULT_LAYOUT_GAP;
    if (Array.isArray(layoutConfig.gap)) {
        if (isPositiveFiniteNumber(layoutConfig.gap[0]) && isPositiveFiniteNumber(layoutConfig.gap[1])) {
            gap = [layoutConfig.gap[0], layoutConfig.gap[1]];
        } else if (isPositiveFiniteNumber(layoutConfig.gap[0])) {
            gap = [layoutConfig.gap[0], DEFAULT_LAYOUT_GAP[1]];
        } else if (isPositiveFiniteNumber(layoutConfig.gap[1])) {
            gap = [DEFAULT_LAYOUT_GAP[0], layoutConfig.gap[1]];
        }
    } else if (isPositiveFiniteNumber(layoutConfig.gap)) {
        gap = [layoutConfig.gap, layoutConfig.gap];
    }

    return {
        layoutSize,
        gap,
    };
}

export function canScroll(node: HTMLElement) {
    const style = window.getComputedStyle(node);

    const canScrollY =
        (style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight;
    const canScrollX =
        (style.overflowX === "auto" || style.overflowX === "scroll") && node.scrollWidth > node.clientWidth;

    return canScrollY || canScrollX;
}

export function getScrollParent(node: HTMLElement): HTMLElement | Window {
    if (!node) {
        return window;
    }
    if (canScroll(node)) {
        return node;
    }
    if (!node.parentElement) {
        return window;
    }
    return getScrollParent(node.parentElement);
}

export function getLayoutItemFixedOffsetParent(container: Element): Element | null {
    let parent: Element | null = container;

    while (parent && parent !== document.documentElement) {
        const style = window.getComputedStyle(parent);

        if (
            style.transform !== "none" ||
            style.scale !== "none" ||
            style.rotate !== "none" ||
            style.translate !== "none" ||
            style.perspective !== "none" ||
            style.filter !== "none" ||
            style.backdropFilter !== "none" ||
            ["paint", "layout", "content", "strict"].includes(style.contain) ||
            /transform|perspective|filter/.test(style.willChange)
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }

    return null;
}

export function getPointerOffset(target: Element, pointer: Pick<PointerEvent, "clientX" | "clientY">): PointerOffset {
    const targetRect = target.getBoundingClientRect();
    const targetBoxMetrics = getContainerBoxMetrics(target);
    const globalOffset = {
        left: pointer.clientX - targetRect.left,
        top: pointer.clientY - targetRect.top,
    };
    const localOffset = {
        left: globalOffset.left / targetBoxMetrics.scaleX,
        top: globalOffset.top / targetBoxMetrics.scaleY,
    };

    return {
        local: localOffset,
        global: globalOffset,
        scaleX: targetBoxMetrics.scaleX,
        scaleY: targetBoxMetrics.scaleY,
    };
}

export function getContainerBoxMetrics(container: HTMLElement | Element): BoxMetrics {
    const style = window.getComputedStyle(container);
    const boxSizing = style.boxSizing || "content-box";
    const borderTop = validatePositiveNumber(parseFloat(style.borderTopWidth));
    const borderRight = validatePositiveNumber(parseFloat(style.borderRightWidth));
    const borderBottom = validatePositiveNumber(parseFloat(style.borderBottomWidth));
    const borderLeft = validatePositiveNumber(parseFloat(style.borderLeftWidth));
    const paddingTop = validatePositiveNumber(parseFloat(style.paddingTop));
    const paddingRight = validatePositiveNumber(parseFloat(style.paddingRight));
    const paddingBottom = validatePositiveNumber(parseFloat(style.paddingBottom));
    const paddingLeft = validatePositiveNumber(parseFloat(style.paddingLeft));
    const height = validatePositiveNumber(parseFloat(style.height));
    const width = validatePositiveNumber(parseFloat(style.width));
    let scaleX = 1;
    let scaleY = 1;
    let shouldUseProbe = true;
    if (container instanceof HTMLElement) {
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            const rect = container.getBoundingClientRect();
            scaleX = rect.width / container.offsetWidth;
            scaleX = Math.abs(scaleX - 1) < 1e-4 ? 1 : parseFloat(scaleX.toFixed(4));
            scaleY = rect.height / container.offsetHeight;
            scaleY = Math.abs(scaleY - 1) < 1e-4 ? 1 : parseFloat(scaleY.toFixed(4));
            shouldUseProbe = false;
        }
    }
    if (shouldUseProbe) {
        const probe = document.createElement("div");
        probe.style.position = "absolute";
        probe.style.left = "0";
        probe.style.top = "0";
        probe.style.width = "100px";
        probe.style.height = "100px";
        probe.style.visibility = "hidden";
        probe.style.opacity = "0";
        probe.style.boxSizing = "border-box";
        probe.style.pointerEvents = "none";
        container.appendChild(probe);
        const probeRect = probe.getBoundingClientRect();
        scaleX = probeRect.width / probe.offsetWidth;
        scaleX = Math.abs(scaleX - 1) < 1e-4 ? 1 : parseFloat(scaleX.toFixed(4));
        scaleY = probeRect.height / probe.offsetHeight;
        scaleY = Math.abs(scaleY - 1) < 1e-4 ? 1 : parseFloat(scaleY.toFixed(4));
        container.removeChild(probe);
    }
    const layoutWidth = container.clientWidth - paddingLeft - paddingRight;
    const layoutHeight = container.clientHeight - paddingTop - paddingBottom;
    return {
        borderTop,
        borderRight,
        borderBottom,
        borderLeft,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        boxSizing,
        height,
        width,
        layoutWidth,
        layoutHeight,
        scaleX,
        scaleY,
    };
}

export function getContainerSize(containerBoxMetrics: BoxMetrics, items: RenderItem<LayoutItem>[]): Size {
    const contentMaxBottom = items.reduce(
        (max, item) => {
            return {
                width: Math.max(max.width, item.left + item.width),
                height: Math.max(max.height, item.top + item.height),
            };
        },
        { width: 0, height: 0 },
    );

    let height = 0;
    let width = 0;
    if (containerBoxMetrics.boxSizing === "border-box") {
        height =
            contentMaxBottom.height +
            containerBoxMetrics.borderTop +
            containerBoxMetrics.borderBottom +
            containerBoxMetrics.paddingBottom;
        width =
            contentMaxBottom.width +
            containerBoxMetrics.borderLeft +
            containerBoxMetrics.borderRight +
            containerBoxMetrics.paddingRight;
    } else {
        height = contentMaxBottom.height;
        width = contentMaxBottom.width;
    }

    return {
        width,
        height,
    };
}

export function getDistance(
    a: Pick<PointerEvent, "clientX" | "clientY">,
    b: Pick<PointerEvent, "clientX" | "clientY">,
) {
    return Math.sqrt((a.clientX - b.clientX) ** 2 + (a.clientY - b.clientY) ** 2);
}

export function isIntersecting(item1: RenderItem<LayoutItem>, item2: RenderItem<LayoutItem>): boolean {
    return (
        item1.left < item2.left + item2.width &&
        item1.left + item1.width > item2.left &&
        item1.top < item2.top + item2.height &&
        item1.top + item1.height > item2.top
    );
}

export function syncLayoutItems<T extends LayoutItem>(
    renderItems: RenderItem<T>[],
    layoutItems: RenderItem<T>[],
    skipRenderIds: string[] = [],
): RenderItem<T>[] {
    const layoutMap = new Map(layoutItems.map((item) => [item.data.id, item]));
    const renderIds = new Set(renderItems.map((item) => item.data.id));
    const skipRenderIdsSet = new Set(skipRenderIds);

    const existingItems = renderItems
        .filter((oldItem) => layoutMap.has(oldItem.data.id))
        .map((oldItem) => {
            const newItem = layoutMap.get(oldItem.data.id);
            const isChanged = !isDeepEqual(oldItem, newItem);

            return isChanged ? { ...oldItem, ...newItem } : oldItem;
        });

    const newItems = layoutItems.filter((item) => !renderIds.has(item.data.id)).map((item) => ({ ...item }));

    const syncedItems = [...existingItems, ...newItems];
    if (skipRenderIds.length > 0) {
        return syncedItems.filter((item) => !skipRenderIdsSet.has(item.data.id));
    }
    return syncedItems;
}
