import { describe, expect, it } from "vitest";
import type { ConstraintContext, Position } from "../../core/types";
import { containerConstraint } from "../containerConstraint";

describe("containerConstraint", () => {
    const createMockContext = (
        itemLocalRect: { left: number; top: number; width: number; height: number },
        containerLocalRect: { left: number; top: number; width: number; height: number },
        localPosition: Position,
        overrides?: Partial<ConstraintContext>,
    ): ConstraintContext => ({
        item: { id: "test-item" },
        startLocalPosition: { left: 0, top: 0 },
        localPosition,
        globalPosition: { left: 0, top: 0 },
        windowRect: { left: 0, top: 0, width: 1920, height: 1080 },
        itemLocalRect,
        itemGlobalRect: { left: 0, top: 0, width: 100, height: 100 },
        containerLocalRect,
        containerGlobalRect: { left: 0, top: 0, width: 500, height: 500 },
        pointer: { clientX: 0, clientY: 0 },
        globalPositionToLocalPosition: (pos: Position) => pos,
        ...overrides,
    });

    describe("basic functionality", () => {
        it("should return a constraint object with apply method", () => {
            const constraint = containerConstraint();
            expect(constraint).toHaveProperty("apply");
            expect(typeof constraint.apply).toBe("function");
        });

        it("should not modify position when item is inside container", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 50, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result).toEqual({ left: 50, top: 50 });
        });
    });

    describe("boundary constraints", () => {
        it("should constrain item when exceeding left boundary", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: -20, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: -20, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(50);
        });

        it("should constrain item when exceeding right boundary", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 450, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 450, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(400);
            expect(result.top).toBe(50);
        });

        it("should constrain item when exceeding top boundary", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 50, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(0);
        });

        it("should constrain item when exceeding bottom boundary", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 50, top: 450, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: 450 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(400);
        });

        it("should constrain item when exceeding multiple boundaries", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: -20, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });
    });

    describe("with options", () => {
        it("should not constrain left when left option is false", () => {
            const constraint = containerConstraint({ left: false });
            const context = createMockContext(
                { left: -20, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: -20, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(-20);
            expect(result.top).toBe(50);
        });

        it("should not constrain right when right option is false", () => {
            const constraint = containerConstraint({ right: false });
            const context = createMockContext(
                { left: 450, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 450, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(450);
            expect(result.top).toBe(50);
        });

        it("should not constrain top when top option is false", () => {
            const constraint = containerConstraint({ top: false });
            const context = createMockContext(
                { left: 50, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(-20);
        });

        it("should not constrain bottom when bottom option is false", () => {
            const constraint = containerConstraint({ bottom: false });
            const context = createMockContext(
                { left: 50, top: 450, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: 450 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(450);
        });

        it("should handle all options set to false", () => {
            const constraint = containerConstraint({
                left: false,
                right: false,
                top: false,
                bottom: false,
            });
            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: -20, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(-20);
            expect(result.top).toBe(-20);
        });

        it("should handle empty options object", () => {
            const constraint = containerConstraint({});
            const context = createMockContext(
                { left: -20, top: -20, width: 100, height: 100 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: -20, top: -20 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });
    });

    describe("edge cases", () => {
        it("should handle item larger than container", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 0, top: 0, width: 600, height: 600 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 0, top: 0 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });

        it("should handle zero-sized container", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 50, top: 50, width: 100, height: 100 },
                { left: 0, top: 0, width: 0, height: 0 },
                { left: 50, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });

        it("should handle container with offset", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 80, top: 80, width: 100, height: 100 },
                { left: 100, top: 100, width: 500, height: 500 },
                { left: 80, top: 80 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(100);
        });

        it("should handle zero-sized item", () => {
            const constraint = containerConstraint();
            const context = createMockContext(
                { left: 50, top: 50, width: 0, height: 0 },
                { left: 0, top: 0, width: 500, height: 500 },
                { left: 50, top: 50 },
            );

            const result = constraint.apply(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });
    });
});
