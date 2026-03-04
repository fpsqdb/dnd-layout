import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import type { LayoutConfig, LayoutItem, LayoutSize, RenderItem } from "../types";
import {
    canScroll,
    getContainerBoxMetrics,
    getContainerSize,
    getDistance,
    getLayoutItemFixedOffsetParent,
    getPointerOffset,
    getRenderConfig,
    getScrollParent,
    isDeepEqual,
    isFirefox,
    isIntersecting,
    isPositiveFiniteNumber,
    syncLayoutItems,
    validatePositiveInteger,
    validatePositiveNumber,
    validateSpan,
} from "../utils";

describe("utils", () => {
    describe("isPositiveFiniteNumber", () => {
        it("should accept positive finite numbers", () => {
            expect(isPositiveFiniteNumber(0)).toBe(true);
            expect(isPositiveFiniteNumber(1)).toBe(true);
            expect(isPositiveFiniteNumber(100.5)).toBe(true);
        });

        it("should reject negative numbers", () => {
            expect(isPositiveFiniteNumber(-1)).toBe(false);
            expect(isPositiveFiniteNumber(-100)).toBe(false);
        });

        it("should reject non-finite numbers", () => {
            expect(isPositiveFiniteNumber(Infinity)).toBe(false);
            expect(isPositiveFiniteNumber(-Infinity)).toBe(false);
            expect(isPositiveFiniteNumber(NaN)).toBe(false);
        });

        it("should reject non-numeric types", () => {
            expect(isPositiveFiniteNumber("123" as unknown)).toBe(false);
            expect(isPositiveFiniteNumber(null as unknown)).toBe(false);
            expect(isPositiveFiniteNumber(undefined as unknown)).toBe(false);
            expect(isPositiveFiniteNumber({} as unknown)).toBe(false);
        });
    });

    describe("isFirefox", () => {
        let userAgentGetter: MockInstance;

        beforeEach(() => {
            userAgentGetter = vi.spyOn(navigator, "userAgent", "get");
        });

        afterEach(() => {
            userAgentGetter.mockRestore();
        });

        it("should return true if user agent contains 'firefox'", () => {
            userAgentGetter.mockReturnValue(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
            );
            expect(isFirefox()).toBe(true);
        });

        it("should return false if user agent does not contain 'firefox'", () => {
            userAgentGetter.mockReturnValue(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (HTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            );
            expect(isFirefox()).toBe(false);
        });
    });

    describe("validatePositiveNumber", () => {
        it("should return the value if it's a positive finite number and greater than or equal to min", () => {
            expect(validatePositiveNumber(10, 0, 5)).toBe(10);
            expect(validatePositiveNumber(0, 0, 5)).toBe(0);
            expect(validatePositiveNumber(10.5, 0, 5)).toBe(10.5);
            expect(validatePositiveNumber(5, 5, 1)).toBe(5);
        });

        it("should return defaultValue if value is less than min", () => {
            expect(validatePositiveNumber(3, 5, 10)).toBe(10);
            expect(validatePositiveNumber(-1, 0, 5)).toBe(5);
        });

        it("should return defaultValue if value is not a number", () => {
            expect(validatePositiveNumber("abc" as unknown as number, 0, 5)).toBe(5);
            expect(validatePositiveNumber(null as unknown as number, 0, 5)).toBe(5);
            expect(validatePositiveNumber(undefined as unknown as number, 0, 5)).toBe(5);
        });

        it("should return defaultValue if value is not finite", () => {
            expect(validatePositiveNumber(Infinity, 0, 5)).toBe(5);
            expect(validatePositiveNumber(-Infinity, 0, 5)).toBe(5);
            expect(validatePositiveNumber(NaN, 0, 5)).toBe(5);
        });

        it("should use default min and defaultValue if not provided", () => {
            expect(validatePositiveNumber(10)).toBe(10);
            expect(validatePositiveNumber(-1)).toBe(0); // Default min 0, default defaultValue 0
            expect(validatePositiveNumber("test" as unknown as number)).toBe(0);
        });
    });

    describe("validatePositiveInteger", () => {
        it("should return the value if it's a positive finite integer and greater than or equal to min", () => {
            expect(validatePositiveInteger(10, 1, 5)).toBe(10);
            expect(validatePositiveInteger(1, 1, 5)).toBe(1);
            expect(validatePositiveInteger(0, 0, 5)).toBe(0);
        });

        it("should return defaultValue if value is less than min", () => {
            expect(validatePositiveInteger(3, 5, 10)).toBe(10);
            expect(validatePositiveInteger(-1, 1, 5)).toBe(5);
        });

        it("should return defaultValue if value is not an integer", () => {
            expect(validatePositiveInteger(10.5, 1, 5)).toBe(5);
        });

        it("should return defaultValue if value is not a number", () => {
            expect(validatePositiveInteger("abc" as unknown as number, 1, 5)).toBe(5);
            expect(validatePositiveInteger(null as unknown as number, 1, 5)).toBe(5);
            expect(validatePositiveInteger(undefined as unknown as number, 1, 5)).toBe(5);
        });

        it("should return defaultValue if value is not finite", () => {
            expect(validatePositiveInteger(Infinity, 1, 5)).toBe(5);
            expect(validatePositiveInteger(-Infinity, 1, 5)).toBe(5);
            expect(validatePositiveInteger(NaN, 1, 5)).toBe(5);
        });

        it("should use default min and defaultValue if not provided", () => {
            expect(validatePositiveInteger(10)).toBe(10);
            expect(validatePositiveInteger(0)).toBe(1); // Default min 1, default defaultValue 1
            expect(validatePositiveInteger("test" as unknown as number)).toBe(1);
        });
    });

    describe("validateSpan", () => {
        it("should return the normalized span if it's within range", () => {
            expect(validateSpan(1, 5)).toBe(1);
            expect(validateSpan(3, 5)).toBe(3);
            expect(validateSpan(5, 5)).toBe(5);
            expect(validateSpan(4.9, 5)).toBe(4);
        });

        it("should return 1 for spans less than 1", () => {
            expect(validateSpan(0, 5)).toBe(1);
            expect(validateSpan(-1, 5)).toBe(1);
        });

        it("should return maxSpan if span is too large", () => {
            expect(validateSpan(6, 5)).toBe(5);
            expect(validateSpan(10, 5)).toBe(5);
        });

        it("should return maxSpan for Infinity", () => {
            expect(validateSpan(Infinity, 5)).toBe(5);
        });

        it("should return 1 for non-numeric inputs", () => {
            expect(validateSpan("abc" as unknown as number, 5)).toBe(1);
            expect(validateSpan(null as unknown as number, 5)).toBe(1);
            expect(validateSpan(undefined as unknown as number, 5)).toBe(1);
            expect(validateSpan(NaN, 5)).toBe(1);
        });

        it("should handle maxSpan of 0", () => {
            expect(validateSpan(1, 0)).toBe(0);
            expect(validateSpan(Infinity, 0)).toBe(0);
        });
    });

    describe("isDeepEqual", () => {
        it("should return true for identical primitive values", () => {
            expect(isDeepEqual(1, 1)).toBe(true);
            expect(isDeepEqual("test", "test")).toBe(true);
            expect(isDeepEqual(true, true)).toBe(true);
        });

        it("should return false for different primitive values", () => {
            expect(isDeepEqual(1, 2)).toBe(false);
            expect(isDeepEqual("test", "different")).toBe(false);
            expect(isDeepEqual(true, false)).toBe(false);
        });

        it("should use Object.is for special number cases", () => {
            expect(isDeepEqual(NaN, NaN)).toBe(true);
            expect(isDeepEqual(0, -0)).toBe(false); // Object.is distinguishes 0 and -0
            expect(isDeepEqual(0, 0)).toBe(true);
        });

        it("should compare Date objects", () => {
            const date1 = new Date("2024-01-01");
            const date2 = new Date("2024-01-01");
            const date3 = new Date("2024-01-02");

            expect(isDeepEqual(date1, date2)).toBe(true);
            expect(isDeepEqual(date1, date3)).toBe(false);
        });

        it("should compare RegExp objects", () => {
            const regex1 = /test/gi;
            const regex2 = /test/gi;
            const regex3 = /other/gi;

            expect(isDeepEqual(regex1, regex2)).toBe(true);
            expect(isDeepEqual(regex1, regex3)).toBe(false);
        });

        it("should deeply compare objects", () => {
            const obj1 = { a: 1, b: { c: 2 } };
            const obj2 = { a: 1, b: { c: 2 } };
            const obj3 = { a: 1, b: { c: 3 } };

            expect(isDeepEqual(obj1, obj2)).toBe(true);
            expect(isDeepEqual(obj1, obj3)).toBe(false);
        });

        it("should return false when object shapes are different", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 1 };
            expect(isDeepEqual(obj1, obj2)).toBe(false);
        });

        it("should handle when obj2 does not have a property that obj1 has", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { a: 1 };
            expect(isDeepEqual(obj1, obj2)).toBe(false);
        });

        it("should handle deeply nested structures with missing properties", () => {
            const obj1 = { a: { b: { c: 1, d: 2 } } };
            const obj2 = { a: { b: { c: 1 } } };
            expect(isDeepEqual(obj1, obj2)).toBe(false);
        });

        it("should compare arrays", () => {
            expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(isDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
            expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false);
        });

        it("should return false for arrays with different lengths", () => {
            const arr1 = [1, 2, 3];
            const arr2 = [1, 2];
            expect(isDeepEqual(arr1, arr2)).toBe(false);
        });

        it("should return false for arrays with different values", () => {
            const arr1 = [1, 2, 3];
            const arr2 = [1, 2, 4];
            expect(isDeepEqual(arr1, arr2)).toBe(false);
        });

        it("should handle null and undefined", () => {
            expect(isDeepEqual(null, null)).toBe(true);
            expect(isDeepEqual(undefined, undefined)).toBe(true);
            expect(isDeepEqual(null, undefined)).toBe(false);
            expect(isDeepEqual(null, {})).toBe(false);
            expect(isDeepEqual(undefined, {})).toBe(false);
        });

        it("should reject different types", () => {
            expect(isDeepEqual(1, "1" as unknown as number)).toBe(false);
            expect(isDeepEqual({}, [])).toBe(false);
            expect(isDeepEqual(null, {})).toBe(false);
        });

        it("should handle nested structures", () => {
            const complex1 = {
                a: 1,
                b: [1, 2, { c: 3 }],
                d: { e: { f: 4 } },
            };
            const complex2 = {
                a: 1,
                b: [1, 2, { c: 3 }],
                d: { e: { f: 4 } },
            };
            const complex3 = {
                a: 1,
                b: [1, 2, { c: 3 }],
                d: { e: { f: 5 } },
            };

            expect(isDeepEqual(complex1, complex2)).toBe(true);
            expect(isDeepEqual(complex1, complex3)).toBe(false);
        });

        it("should check object key count", () => {
            expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
            expect(isDeepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
        });

        it("should skip not own properties", () => {
            const obj1 = { a: 2, shared: 1 };

            const proto = { shared: 1 };
            const obj2 = Object.create(proto);
            obj2.a = 2;
            obj2.b = 4;

            expect(isDeepEqual(obj1, obj2)).toBe(false);
        });
    });

    describe("getRenderConfig", () => {
        const layoutSize: LayoutSize = {
            layoutWidth: 400,
            layoutHeight: 300,
        };

        it("should use default gap", () => {
            const config: LayoutConfig = {};
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([12, 12]);
            expect(result.layoutSize).toEqual(layoutSize);
        });

        it("should handle single gap value", () => {
            const config: LayoutConfig = { gap: 20 };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([20, 20]);
        });

        it("should handle array gap values", () => {
            const config: LayoutConfig = { gap: [10, 30] };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([10, 30]);
        });

        it("should validate gap values", () => {
            const config: LayoutConfig = { gap: -5 };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([12, 12]);
        });

        it("should handle invalid array horizontal gap", () => {
            const config: LayoutConfig = { gap: [-5, 10] as unknown as [number, number] };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([12, 10]);
        });

        it("should handle invalid array vertical gap", () => {
            const config: LayoutConfig = { gap: [10, -5] as unknown as [number, number] };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([10, 12]);
        });

        it("should handle invalid array horizontal and vertical gap", () => {
            const config: LayoutConfig = { gap: [-5, -5] as unknown as [number, number] };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([12, 12]);
        });

        it("should handle non-numeric gap", () => {
            const config: LayoutConfig = { gap: "invalid" as unknown as number };
            const result = getRenderConfig(config, layoutSize);

            expect(result.gap).toEqual([12, 12]);
        });

        it("should preserve layout size", () => {
            const config: LayoutConfig = { gap: 15 };
            const result = getRenderConfig(config, layoutSize);

            expect(result.layoutSize).toEqual(layoutSize);
        });
    });

    describe("canScroll", () => {
        let element: HTMLElement;

        beforeEach(() => {
            element = document.createElement("div");
            document.body.appendChild(element);
        });

        afterEach(() => {
            if (element && element.parentNode === document.body) {
                document.body.removeChild(element);
            }
        });

        it("non-scrollable element should return false", () => {
            expect(canScroll(element)).toBe(false);
        });

        it("should detect vertical scroll", () => {
            element.style.overflowY = "auto";
            element.style.height = "100px";
            element.style.width = "100px";
            element.innerHTML = "<div style='height: 200px;'></div>";

            expect(canScroll(element)).toBe(true);
        });

        it("should detect horizontal scroll", () => {
            element.style.overflowX = "scroll";
            element.style.height = "100px";
            element.style.width = "100px";
            element.innerHTML = "<div style='width: 200px;'></div>";

            expect(canScroll(element)).toBe(true);
        });

        it("should ignore hidden overflow", () => {
            element.style.overflowY = "hidden";
            element.style.height = "100px";
            element.style.width = "100px";
            element.innerHTML = "<div style='height: 200px;'></div>";

            expect(canScroll(element)).toBe(false);
        });
    });

    describe("getScrollParent", () => {
        it("should return window when no scrollable parent exists", () => {
            const div = document.createElement("div");
            expect(getScrollParent(div)).toBe(window);
        });

        it("should return the closest scrollable parent", () => {
            const scrollableDiv = document.createElement("div");
            const childDiv = document.createElement("div");
            childDiv.style.height = "500px";
            scrollableDiv.appendChild(childDiv);

            scrollableDiv.style.overflow = "auto";
            scrollableDiv.style.height = "100px";
            document.body.appendChild(scrollableDiv);

            expect(getScrollParent(childDiv)).toBe(scrollableDiv);

            document.body.removeChild(scrollableDiv);
        });

        it("should recursively call getScrollParent when parent element exists but isn't scrollable", () => {
            const grandParent = document.createElement("div");
            const parent = document.createElement("div");
            const child = document.createElement("div");

            grandParent.appendChild(parent);
            parent.appendChild(child);
            document.body.appendChild(grandParent);

            grandParent.style.overflow = "auto";
            grandParent.style.height = "100px";

            parent.style.overflow = "visible";
            parent.style.height = "200px";

            const result = getScrollParent(child);

            expect(result).toBe(grandParent);

            document.body.removeChild(grandParent);
        });
    });

    describe("getLayoutItemFixedOffsetParent", () => {
        let el: HTMLElement;
        let parentEl: HTMLElement;
        let grandParentEl: HTMLElement;

        beforeEach(() => {
            el = document.createElement("div");
            parentEl = document.createElement("div");
            grandParentEl = document.createElement("div");

            parentEl.appendChild(el);
            grandParentEl.appendChild(parentEl);
            document.body.appendChild(grandParentEl);

            // Reset styles for each test to ensure a clean slate
            el.style.all = "";
            parentEl.style.all = "";
            grandParentEl.style.all = "";
        });

        afterEach(() => {
            document.body.removeChild(grandParentEl);
        });

        it("should return null if no fixed offset parent is found", () => {
            expect(getLayoutItemFixedOffsetParent(el)).toBeNull();
        });

        it("should return the parent if it has a transform", () => {
            parentEl.style.transform = "translateX(10px)";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a scale", () => {
            parentEl.style.scale = "0.5";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a rotate", () => {
            parentEl.style.rotate = "45deg";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a translate", () => {
            parentEl.style.translate = "10px 20px";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a perspective", () => {
            parentEl.style.perspective = "100px";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a filter", () => {
            parentEl.style.filter = "blur(2px)";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a backdropFilter", () => {
            parentEl.style.backdropFilter = "blur(2px)";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a contain property that includes 'paint'", () => {
            parentEl.style.contain = "paint";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the parent if it has a will-change property that includes 'transform'", () => {
            parentEl.style.willChange = "transform";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(parentEl);
        });

        it("should return the grand-parent if it's the fixed offset parent", () => {
            grandParentEl.style.transform = "translateX(10px)";
            expect(getLayoutItemFixedOffsetParent(el)).toBe(grandParentEl);
        });
    });

    describe("getPointerOffset", () => {
        let target: HTMLElement;

        beforeEach(() => {
            target = document.createElement("div");
            document.body.appendChild(target);
            target.style.position = "absolute";
            target.style.left = "100px";
            target.style.top = "50px";
            target.style.width = "200px";
            target.style.height = "100px";
        });

        afterEach(() => {
            document.body.removeChild(target);
        });

        it("should calculate correct offsets with no scaling", () => {
            const pointer = { clientX: 150, clientY: 75 };
            const offset = getPointerOffset(target, pointer);

            expect(offset.global).toEqual({ left: 50, top: 25 });
            expect(offset.local).toEqual({ left: 50, top: 25 });
            expect(offset.scaleX).toBe(1);
            expect(offset.scaleY).toBe(1);
        });

        it("should calculate correct offsets with scaling", () => {
            target.style.transform = "scale(2)";
            target.style.transformOrigin = "0 0";

            const pointer = { clientX: 200, clientY: 100 };
            const offset = getPointerOffset(target, pointer);

            expect(offset.global).toEqual({ left: 100, top: 50 });
            expect(offset.scaleX).toBe(2);
            expect(offset.scaleY).toBe(2);
            expect(offset.local.left).toBeCloseTo(50);
            expect(offset.local.top).toBeCloseTo(25);
        });

        it("should handle zero width/height elements without error", () => {
            target.style.width = "0px";
            target.style.height = "0px";

            const pointer = { clientX: 100, clientY: 50 };
            const offset = getPointerOffset(target, pointer);

            expect(offset.global).toEqual({ left: 0, top: 0 });
            expect(offset.local).toEqual({ left: 0, top: 0 });
            expect(offset.scaleX).toBe(1);
            expect(offset.scaleY).toBe(1);
        });
    });

    describe("getContainerBoxMetrics", () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement("div");
            document.body.appendChild(container);
            container.style.all = "";
            container.style.position = "absolute";
            container.style.top = "0px";
            container.style.left = "0px";
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        it("should return default metrics with no styling", () => {
            container.style.width = "0px";
            container.style.height = "0px";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics).toEqual({
                borderTop: 0,
                borderRight: 0,
                borderBottom: 0,
                borderLeft: 0,
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                boxSizing: "content-box",
                height: 0,
                width: 0,
                layoutWidth: 0,
                layoutHeight: 0,
                scaleX: 1,
                scaleY: 1,
            });
        });

        it("should calculate scaleX correctly with precise values", () => {
            container.style.width = "100px";
            container.style.height = "100px";

            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleX).toBe(1);

            container.style.scale = "1.0000000000001212";
            const metrics2 = getContainerBoxMetrics(container);
            expect(metrics2.scaleX).toBe(1);

            container.style.scale = "0.9999999999999999";
            const metrics3 = getContainerBoxMetrics(container);
            expect(metrics3.scaleX).toBe(1);

            container.style.scale = "1.00012123";
            const metrics4 = getContainerBoxMetrics(container);
            expect(metrics4.scaleX).toBe(1.0001);
        });

        it("should calculate scaleY correctly with precise values", () => {
            container.style.width = "100px";
            container.style.height = "100px";

            container.style.scale = "0.5";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleY).toBe(0.5);
        });

        it("should handle zero offsetWidth for none scale", () => {
            container.style.width = "0px";
            container.style.height = "100px";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleX).toBe(1);
            expect(metrics.scaleY).toBe(1);
        });

        it("should handle zero offsetWidth with precise values", () => {
            container.style.width = "0px";
            container.style.height = "100px";
            container.style.scale = "0.5";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleX).toBe(0.5);
            expect(metrics.scaleY).toBe(0.5);
        });

        it("should handle zero offsetHeight for none scale", () => {
            container.style.width = "100px";
            container.style.height = "0px";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleX).toBe(1);
            expect(metrics.scaleY).toBe(1);
        });

        it("should handle zero offsetHeight with precise values", () => {
            container.style.width = "100px";
            container.style.height = "0px";
            container.style.scale = "0.5";
            const metrics = getContainerBoxMetrics(container);
            expect(metrics.scaleX).toBe(0.5);
            expect(metrics.scaleY).toBe(0.5);
        });

        it("should handle none HtmlElement with precise values", () => {
            const SVG_NS = "http://www.w3.org";
            const svg = document.createElementNS(SVG_NS, "svg");
            const path = document.createElementNS(SVG_NS, "path");
            path.setAttribute("d", "M 10 10 L 50 50");
            svg.appendChild(path);
            document.body.appendChild(svg);
            const container = document.createElement("div");
            container.style.width = "100px";
            container.style.height = "0px";
            container.style.scale = "0.5";
            container.appendChild(svg);
            document.body.appendChild(container);
            const metrics = getContainerBoxMetrics(svg);
            expect(metrics.scaleX).toBe(0.5);
            expect(metrics.scaleY).toBe(0.5);
        });

        it("should calculate layout dimensions with padding and border for content-box", () => {
            container.style.width = "100px";
            container.style.height = "100px";
            container.style.border = "solid";
            container.style.borderWidth = "4px 3px 2px 10px";
            container.style.padding = "5px 6px 7px 8px";

            const metrics = getContainerBoxMetrics(container);
            expect(metrics.borderTop).toBe(4);
            expect(metrics.borderRight).toBe(3);
            expect(metrics.borderBottom).toBe(2);
            expect(metrics.borderLeft).toBe(10);
            expect(metrics.paddingTop).toBe(5);
            expect(metrics.paddingRight).toBe(6);
            expect(metrics.paddingBottom).toBe(7);
            expect(metrics.paddingLeft).toBe(8);
            expect(metrics.boxSizing).toBe("content-box");
            expect(metrics.width).toBe(100);
            expect(metrics.height).toBe(100);
            expect(metrics.layoutWidth).toBe(100);
            expect(metrics.layoutHeight).toBe(100);
            expect(metrics.scaleX).toBe(1);
            expect(metrics.scaleY).toBe(1);
        });

        it("should calculate layout dimensions with padding and border for border-box", () => {
            container.style.boxSizing = "border-box";
            container.style.width = "100px";
            container.style.height = "100px";
            container.style.border = "solid";
            container.style.borderWidth = "4px 3px 2px 10px";
            container.style.padding = "5px 6px 7px 8px";

            const metrics = getContainerBoxMetrics(container);
            expect(metrics.borderTop).toBe(4);
            expect(metrics.borderRight).toBe(3);
            expect(metrics.borderBottom).toBe(2);
            expect(metrics.borderLeft).toBe(10);
            expect(metrics.paddingTop).toBe(5);
            expect(metrics.paddingRight).toBe(6);
            expect(metrics.paddingBottom).toBe(7);
            expect(metrics.paddingLeft).toBe(8);
            expect(metrics.boxSizing).toBe("border-box");
            expect(metrics.width).toBe(100);
            expect(metrics.height).toBe(100);
            expect(metrics.layoutWidth).toBe(73);
            expect(metrics.layoutHeight).toBe(82);
            expect(metrics.scaleX).toBe(1);
            expect(metrics.scaleY).toBe(1);
        });
    });

    describe("getContainerSize", () => {
        it("should calculate correct size for content-box with no items", () => {
            const containerBoxMetrics = {
                borderTop: 0,
                borderRight: 0,
                borderBottom: 0,
                borderLeft: 0,
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                boxSizing: "content-box",
                height: 0,
                width: 0,
                layoutWidth: 0,
                layoutHeight: 0,
                scaleX: 1,
                scaleY: 1,
            };
            const items: RenderItem<LayoutItem>[] = [];
            const size = getContainerSize(containerBoxMetrics, items);
            expect(size).toEqual({ width: 0, height: 0 });
        });

        it("should calculate correct size for content-box with items", () => {
            const containerBoxMetrics = {
                borderTop: 0,
                borderRight: 0,
                borderBottom: 0,
                borderLeft: 0,
                paddingTop: 10,
                paddingRight: 10,
                paddingBottom: 10,
                paddingLeft: 10,
                boxSizing: "content-box",
                height: 100,
                width: 100,
                layoutWidth: 80,
                layoutHeight: 80,
                scaleX: 1,
                scaleY: 1,
            };
            const items: RenderItem<LayoutItem>[] = [
                { data: { id: "1" }, left: 0, top: 0, width: 50, height: 50 },
                { data: { id: "2" }, left: 60, top: 20, width: 40, height: 30 },
            ];
            const size = getContainerSize(containerBoxMetrics, items);
            expect(size).toEqual({ width: 100, height: 50 });
        });

        it("should calculate correct size for border-box with no items", () => {
            const containerBoxMetrics = {
                borderTop: 5,
                borderRight: 5,
                borderBottom: 5,
                borderLeft: 5,
                paddingTop: 10,
                paddingRight: 10,
                paddingBottom: 10,
                paddingLeft: 10,
                boxSizing: "border-box",
                height: 0,
                width: 0,
                layoutWidth: 0,
                layoutHeight: 0,
                scaleX: 1,
                scaleY: 1,
            };
            const items: RenderItem<LayoutItem>[] = [];
            const size = getContainerSize(containerBoxMetrics, items);
            expect(size).toEqual({ width: 20, height: 20 });
        });

        it("should calculate correct size for border-box with items", () => {
            const containerBoxMetrics = {
                borderTop: 5,
                borderRight: 5,
                borderBottom: 5,
                borderLeft: 5,
                paddingTop: 10,
                paddingRight: 10,
                paddingBottom: 10,
                paddingLeft: 10,
                boxSizing: "border-box",
                height: 100,
                width: 100,
                layoutWidth: 80,
                layoutHeight: 80,
                scaleX: 1,
                scaleY: 1,
            };
            const items: RenderItem<LayoutItem>[] = [
                { data: { id: "1" }, left: 0, top: 0, width: 50, height: 50 },
                { data: { id: "2" }, left: 60, top: 20, width: 40, height: 30 },
            ];
            const size = getContainerSize(containerBoxMetrics, items);
            expect(size).toEqual({ width: 120, height: 70 });
        });

        it("should handle empty items array", () => {
            const containerBoxMetrics = {
                borderTop: 5,
                borderRight: 5,
                borderBottom: 5,
                borderLeft: 5,
                paddingTop: 10,
                paddingRight: 10,
                paddingBottom: 10,
                paddingLeft: 10,
                boxSizing: "border-box",
                height: 100,
                width: 100,
                layoutWidth: 80,
                layoutHeight: 80,
                scaleX: 1,
                scaleY: 1,
            };
            const items: RenderItem<LayoutItem>[] = [];
            const size = getContainerSize(containerBoxMetrics, items);
            expect(size).toEqual({ width: 20, height: 20 });
        });
    });

    describe("getDistance", () => {
        it("should calculate the distance between two points", () => {
            const point1 = { clientX: 0, clientY: 0 };
            const point2 = { clientX: 3, clientY: 4 };
            expect(getDistance(point1, point2)).toBe(5);
        });

        it("should return 0 for identical points", () => {
            const point1 = { clientX: 10, clientY: 20 };
            const point2 = { clientX: 10, clientY: 20 };
            expect(getDistance(point1, point2)).toBe(0);
        });

        it("should handle negative coordinates", () => {
            const point1 = { clientX: -1, clientY: -1 };
            const point2 = { clientX: 2, clientY: 3 };
            expect(getDistance(point1, point2)).toBe(5);
        });
    });

    describe("isIntersecting", () => {
        it("should return true for overlapping items", () => {
            const item1 = { left: 0, top: 0, width: 10, height: 10 };
            const item2 = { left: 5, top: 5, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(true);
        });

        it("should return true for one item completely inside another", () => {
            const item1 = { left: 0, top: 0, width: 20, height: 20 };
            const item2 = { left: 5, top: 5, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(true);
        });

        it("should return false for items sharing a border", () => {
            const item1 = { left: 0, top: 0, width: 10, height: 10 };
            const item2 = { left: 10, top: 0, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(false);
        });

        // Test cases for non-intersecting
        it("should return false for non-overlapping items (far apart)", () => {
            const item1 = { left: 0, top: 0, width: 10, height: 10 };
            const item2 = { left: 20, top: 20, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(false);
        });

        it("should return false for non-overlapping items (adjacent horizontal)", () => {
            const item1 = { left: 0, top: 0, width: 10, height: 10 };
            const item2 = { left: 11, top: 0, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(false);
        });

        it("should return false for non-overlapping items (adjacent vertical)", () => {
            const item1 = { left: 0, top: 0, width: 10, height: 10 };
            const item2 = { left: 0, top: 11, width: 10, height: 10 };
            expect(isIntersecting(item1 as RenderItem<LayoutItem>, item2 as RenderItem<LayoutItem>)).toBe(false);
        });
    });

    describe("syncLayoutItems", () => {
        const layoutItem1 = { id: "1", name: "item1" };
        const layoutItem2 = { id: "2", name: "item2" };
        const layoutItem3 = { id: "3", name: "item3" };

        const renderItem1: RenderItem<typeof layoutItem1> = {
            data: layoutItem1,
            left: 0,
            top: 0,
            width: 10,
            height: 10,
        };
        const renderItem2: RenderItem<typeof layoutItem2> = {
            data: layoutItem2,
            left: 10,
            top: 10,
            width: 20,
            height: 20,
        };
        const renderItem3: RenderItem<typeof layoutItem3> = {
            data: layoutItem3,
            left: 20,
            top: 20,
            width: 30,
            height: 30,
        };

        it("should correctly sync items when all are present and unchanged", () => {
            const renderItems = [renderItem1, renderItem2];
            const layoutItems = [renderItem1, renderItem2];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([renderItem1, renderItem2]);
        });

        it("should add new items from layoutItems", () => {
            const renderItems = [renderItem1];
            const layoutItems = [renderItem1, renderItem2];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([renderItem1, renderItem2]);
        });

        it("should update existing items with changed properties", () => {
            const changedRenderItem1 = { ...renderItem1, width: 15, height: 15 };
            const renderItems = [renderItem1, renderItem2];
            const layoutItems = [changedRenderItem1, renderItem2];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([changedRenderItem1, renderItem2]);
            expect(synced[0]).not.toBe(renderItem1);
        });

        it("should remove items not present in layoutItems", () => {
            const renderItems = [renderItem1, renderItem2, renderItem3];
            const layoutItems = [renderItem1, renderItem2];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([renderItem1, renderItem2]);
        });

        it("should handle empty renderItems array", () => {
            const renderItems: RenderItem<typeof layoutItem1>[] = [];
            const layoutItems = [renderItem1];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([renderItem1]);
        });

        it("should handle empty layoutItems array", () => {
            const renderItems = [renderItem1];
            const layoutItems: RenderItem<typeof layoutItem1>[] = [];
            const synced = syncLayoutItems(renderItems, layoutItems);
            expect(synced).toEqual([]);
        });

        it("should filter out items specified in skipRenderIds", () => {
            const renderItems = [renderItem1, renderItem2, renderItem3];
            const layoutItems = [renderItem1, renderItem2, renderItem3];
            const skipRenderIds = ["2"];
            const synced = syncLayoutItems(renderItems, layoutItems, skipRenderIds);
            expect(synced).toEqual([renderItem1, renderItem3]);
        });

        it("should not filter if skipRenderIds is empty", () => {
            const renderItems = [renderItem1, renderItem2];
            const layoutItems = [renderItem1, renderItem2];
            const skipRenderIds: string[] = [];
            const synced = syncLayoutItems(renderItems, layoutItems, skipRenderIds);
            expect(synced).toEqual([renderItem1, renderItem2]);
        });

        it("should handle non-existent skipRenderIds gracefully", () => {
            const renderItems = [renderItem1, renderItem2];
            const layoutItems = [renderItem1, renderItem2];
            const skipRenderIds = ["nonExistentId"];
            const synced = syncLayoutItems(renderItems, layoutItems, skipRenderIds);
            expect(synced).toEqual([renderItem1, renderItem2]);
        });
    });
});
