import { describe, expect, it, vi } from "vitest";
import { RAFThrottle } from "../rafThrottle";

describe("RAFThrottle", () => {
    describe("throttle", () => {
        it("should call requestAnimationFrame with the provided function", async () => {
            const fn = vi.fn();
            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it("should not queue multiple RAF calls when throttle is called multiple times", async () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn1);
            rafThrottle.throttle(fn2);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).not.toHaveBeenCalled();
        });

        it("should call the optional callback after the main function executes", async () => {
            const fn = vi.fn();
            const callback = vi.fn();

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn, callback);

            expect(callback).not.toHaveBeenCalled();

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it("should call callback after fn even if fn throws", async () => {
            const fn = vi.fn().mockImplementation(() => {
                throw new Error("Test error");
            });
            const callback = vi.fn();
            let caughtError: unknown;
            const handler = (e: ErrorEvent) => {
                e.preventDefault();
                caughtError = e.error;
            };
            window.addEventListener("error", handler);

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn, callback);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(caughtError).not.toBeNull();
            expect((caughtError as Error).message).toBe("Test error");
            expect(fn).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledTimes(1);
            window.removeEventListener("error", handler);
        });
    });

    describe("cancel", () => {
        it("call cancel should not throw error if no RAF is pending", async () => {
            const rafThrottle = new RAFThrottle();
            rafThrottle.cancel();
            expect(true).toBe(true);
        });

        it("should allow new throttle calls after cancel", async () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn1);
            rafThrottle.cancel();

            rafThrottle.throttle(fn2);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        it("should not call the function after cancel", async () => {
            const fn = vi.fn();
            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn);

            rafThrottle.cancel();

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn).not.toHaveBeenCalled();
        });
    });

    describe("multiple instances", () => {
        it("should work independently for different instances", async () => {
            const rafThrottle2 = new RAFThrottle();
            const fn1 = vi.fn();
            const fn2 = vi.fn();

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn1);
            rafThrottle2.throttle(fn2);

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        it("should cancel independently for different instances", async () => {
            const rafThrottle2 = new RAFThrottle();
            const fn1 = vi.fn();
            const fn2 = vi.fn();

            const rafThrottle = new RAFThrottle();
            rafThrottle.throttle(fn1);
            rafThrottle2.throttle(fn2);

            rafThrottle.cancel();

            await new Promise((resolve) => requestAnimationFrame(resolve));
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).toHaveBeenCalledTimes(1);
        });
    });
});
