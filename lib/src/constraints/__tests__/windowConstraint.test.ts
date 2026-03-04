import { describe, expect, it } from "vitest";
import type { ConstraintContext, Position } from "../../core/types";
import { windowConstraint } from "../windowConstraint";

describe("windowConstraint", () => {
    const createMockContext = (
        itemGlobalRect: { left: number; top: number; width: number; height: number },
        windowRect: { left: number; top: number; width: number; height: number },
        globalPosition: Position,
        localPosition: Position,
        globalPositionToLocalPosition?: (pos: Position) => Position,
    ): ConstraintContext => ({
        item: { id: "test-item" },
        startLocalPosition: { left: 0, top: 0 },
        localPosition,
        globalPosition,
        windowRect,
        itemLocalRect: { left: 0, top: 0, width: 100, height: 100 },
        itemGlobalRect,
        containerLocalRect: { left: 0, top: 0, width: 500, height: 500 },
        containerGlobalRect: { left: 0, top: 0, width: 500, height: 500 },
        pointer: { clientX: 0, clientY: 0 },
        globalPositionToLocalPosition: globalPositionToLocalPosition || ((pos: Position) => pos),
    });

    describe("basic functionality", () => {
        it("should return a constraint object with apply method", () => {
            const constraint = windowConstraint();
            expect(constraint).toHaveProperty("apply");
            expect(typeof constraint.apply).toBe("function");
        });

        it("should not modify position when item is inside window", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 100, top: 100, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: 100 },
                { left: 100, top: 100 },
            );

            const result = constraint.apply(context);

            expect(result).toEqual({ left: 100, top: 100 });
        });
    });

    describe("boundary constraints", () => {
        it("should constrain item when exceeding left boundary", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: -20, top: 100, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: -20, top: 100 },
                { left: -20, top: 100 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(100);
        });

        it("should constrain item when exceeding right boundary", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 1850, top: 100, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 1850, top: 100 },
                { left: 1850, top: 100 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(1820);
            expect(result.top).toBe(100);
        });

        it("should constrain item when exceeding top boundary", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 100, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: -20 },
                { left: 100, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(0);
        });

        it("should constrain item when exceeding bottom boundary", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 100, top: 1000, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: 1000 },
                { left: 100, top: 1000 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(980);
        });

        it("should constrain item when exceeding multiple boundaries", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: -20, top: -20 },
                { left: -20, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });
    });

    describe("with options", () => {
        it("should not constrain left when left option is false", () => {
            const constraint = windowConstraint({ left: false });
            const context = createMockContext(
                { left: -20, top: 100, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: -20, top: 100 },
                { left: -20, top: 100 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(-20);
            expect(result.top).toBe(100);
        });

        it("should not constrain right when right option is false", () => {
            const constraint = windowConstraint({ right: false });
            const context = createMockContext(
                { left: 1850, top: 100, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 1850, top: 100 },
                { left: 1850, top: 100 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(1850);
            expect(result.top).toBe(100);
        });

        it("should not constrain top when top option is false", () => {
            const constraint = windowConstraint({ top: false });
            const context = createMockContext(
                { left: 100, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: -20 },
                { left: 100, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(-20);
        });

        it("should not constrain bottom when bottom option is false", () => {
            const constraint = windowConstraint({ bottom: false });
            const context = createMockContext(
                { left: 100, top: 1000, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: 1000 },
                { left: 100, top: 1000 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(1000);
        });

        it("should handle all options set to false", () => {
            const constraint = windowConstraint({
                left: false,
                right: false,
                top: false,
                bottom: false,
            });
            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: -20, top: -20 },
                { left: -20, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(-20);
            expect(result.top).toBe(-20);
        });
    });

    describe("globalPositionToLocalPosition transformation", () => {
        it("should use globalPositionToLocalPosition to convert constrained global position to local", () => {
            const constraint = windowConstraint();
            const globalToLocal = (pos: Position): Position => ({
                left: pos.left - 50,
                top: pos.top - 50,
            });

            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: -20, top: -20 },
                { left: -70, top: -70 },
                globalToLocal,
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(-50);
            expect(result.top).toBe(-50);
        });

        it("should handle scaling in globalPositionToLocalPosition", () => {
            const constraint = windowConstraint();
            const scale = 2;
            const globalToLocal = (pos: Position): Position => ({
                left: pos.left / scale,
                top: pos.top / scale,
            });

            const context = createMockContext(
                { left: 100, top: 100, width: 200, height: 200 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 100, top: 100 },
                { left: 50, top: 50 },
                globalToLocal,
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });
    });

    describe("edge cases", () => {
        it("should handle item larger than window", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 0, top: 0, width: 2000, height: 1200 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 0, top: 0 },
                { left: 0, top: 0 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });

        it("should handle zero-sized window", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 50, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 0, height: 0 },
                { left: 50, top: 50 },
                { left: 50, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });

        it("should handle zero-sized item", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 50, top: 50, width: 0, height: 0 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 50, top: 50 },
                { left: 50, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });

        it("should handle item exactly at window boundaries", () => {
            const constraint = windowConstraint();
            const context = createMockContext(
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 0, top: 0, width: 1920, height: 1080 },
                { left: 0, top: 0 },
                { left: 0, top: 0 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });
    });
});
