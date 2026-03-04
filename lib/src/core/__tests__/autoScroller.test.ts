import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { AutoScroller } from "../autoScroller";

describe("AutoScroller", () => {
    let scrollableElement: HTMLElement;

    beforeEach(() => {
        scrollableElement = document.createElement("div");
        scrollableElement.style.backgroundColor = "green";
        scrollableElement.style.overflow = "auto";
        scrollableElement.style.width = "200px";
        scrollableElement.style.height = "200px";
        scrollableElement.innerHTML = '<div style="width: 400px; height: 400px;"></div>';
        document.body.appendChild(scrollableElement);
    });

    afterEach(() => {
        if (scrollableElement.parentNode) {
            scrollableElement.parentNode.removeChild(scrollableElement);
        }
    });

    describe("update", () => {
        it("should not scroll when pointer is in center of element", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 100, clientY: 100 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
            expect(scrollableElement.scrollTop).toBe(0);
        });

        it("should trigger scroll when pointer is near top edge", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            scrollableElement.scrollBy(0, 20);

            const pointer = { clientX: 100, clientY: 10 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
            expect(scrollableElement.scrollTop).toBeLessThan(20);
        });

        it("should trigger scroll when pointer is near bottom edge", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 100, clientY: 190 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
            expect(scrollableElement.scrollTop).toBeGreaterThan(0);
        });

        it("should trigger scroll when pointer is near left edge", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            scrollableElement.scrollBy(20, 0);

            const pointer = { clientX: 10, clientY: 100 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
            expect(scrollableElement.scrollLeft).toBeLessThan(20);
        });

        it("should trigger scroll when pointer is near right edge", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 190, clientY: 100 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
            expect(scrollableElement.scrollLeft).toBeGreaterThan(0);
        });

        it("should call onScroll callback when scrolling", async () => {
            const onScroll = vi.fn();
            const scroller = new AutoScroller({}, onScroll);
            scroller.setTarget(scrollableElement);
            scrollableElement.scrollBy(0, 20);

            const pointer = { clientX: 100, clientY: 10 };
            scroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
        });
    });

    describe("stop", () => {
        it("should cancel pending animation frame", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            scrollableElement.scrollBy(0, 20);

            const pointer = { clientX: 100, clientY: 10 };
            autoScroller.update(pointer);

            autoScroller.stop();

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
            expect(scrollableElement.scrollTop).toBe(20);
        });

        it("should not throw when called without pending animation", () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            expect(() => autoScroller.stop()).not.toThrow();
        });
    });

    describe("scroll direction detection", () => {
        it("should not scroll up when already at top boundary", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 100, clientY: 10 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
        });

        it("should not scroll down when already at bottom boundary", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            let scrollEnded = false;
            scrollableElement.addEventListener("scrollend", () => {
                scrollEnded = true;
            });
            scrollableElement.scrollBy(0, 250);
            await expect.poll(() => scrollEnded).toBe(true);

            const pointer = { clientX: 100, clientY: 190 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
        });

        it("should not scroll left when already at left boundary", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 10, clientY: 100 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
            expect(scrollableElement.scrollLeft).toBe(0);
        });

        it("should not scroll right when already at right boundary", async () => {
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);
            autoScroller.setTarget(scrollableElement);
            let scrollEnded = false;
            scrollableElement.addEventListener("scrollend", () => {
                scrollEnded = true;
            });
            scrollableElement.scrollBy(250, 0);
            await expect.poll(() => scrollEnded).toBe(true);

            const pointer = { clientX: 190, clientY: 100 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).not.toHaveBeenCalled();
        });
    });

    describe("window scrolling", () => {
        let originalSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
        beforeEach(async () => {
            originalSize = {
                width: window.innerWidth,
                height: window.innerHeight,
            };
            await page.viewport(200, 200);
        });

        afterEach(async () => {
            await page.viewport(originalSize.width, originalSize.height);
        });

        it("should scroll window when target is window", async () => {
            await page.viewport(100, 100);
            const onScroll = vi.fn();
            const scroller = new AutoScroller({}, onScroll);
            scroller.setTarget(window);

            const pointer = { clientX: 100, clientY: 10 };
            scroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalled();
            expect(window.scrollX).toBeGreaterThan(0);
        });
    });

    describe("scroll chain", () => {
        it("should build scroll chain from element to window", async () => {
            const parent = document.createElement("div");
            parent.style.backgroundColor = "gray";
            parent.style.overflow = "auto";
            parent.style.width = "100px";
            parent.style.height = "140px";

            parent.appendChild(scrollableElement);
            document.body.appendChild(parent);
            const onScroll = vi.fn();
            const autoScroller = new AutoScroller({}, onScroll);

            autoScroller.setTarget(scrollableElement);

            const pointer = { clientX: 10, clientY: 140 };
            autoScroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(parent.scrollTop).toBeGreaterThan(0);
            expect(scrollableElement.scrollTop).toBeGreaterThan(0);
            expect(onScroll).toHaveBeenCalledTimes(2);

            document.body.removeChild(parent);
        });
    });

    describe("continuous scrolling", () => {
        it("should continue scrolling while pointer remains in scroll zone", async () => {
            const onScroll = vi.fn();
            const scroller = new AutoScroller({}, onScroll);
            scroller.setTarget(scrollableElement);

            const pointer = { clientX: 100, clientY: 190 };
            scroller.update(pointer);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(onScroll).toHaveBeenCalledTimes(2);
            expect(scrollableElement.scrollTop).toBeGreaterThan(0);
        });
    });
});
