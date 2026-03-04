import { describe, expect, it } from "vitest";
import type { ConstraintContext, Position } from "../../core/types";
import { horizontalAxisConstraint, verticalAxisConstraint } from "../axisConstraint";

describe("axisConstraint", () => {
    const createMockContext = (
        startLocalPosition: Position,
        localPosition: Position,
        overrides?: Partial<ConstraintContext>,
    ): ConstraintContext => ({
        item: { id: "test-item" },
        startLocalPosition,
        localPosition,
        globalPosition: { left: 0, top: 0 },
        windowRect: { left: 0, top: 0, width: 1920, height: 1080 },
        itemLocalRect: { left: 0, top: 0, width: 100, height: 100 },
        itemGlobalRect: { left: 0, top: 0, width: 100, height: 100 },
        containerLocalRect: { left: 0, top: 0, width: 500, height: 500 },
        containerGlobalRect: { left: 0, top: 0, width: 500, height: 500 },
        pointer: { clientX: 0, clientY: 0 },
        globalPositionToLocalPosition: (pos: Position) => pos,
        ...overrides,
    });

    describe("verticalAxisConstraint", () => {
        it("should return a constraint object with constrain method", () => {
            const constraint = verticalAxisConstraint();
            expect(constraint).toHaveProperty("constrain");
            expect(typeof constraint.constrain).toBe("function");
        });

        it("should lock horizontal movement (left stays at start position)", () => {
            const constraint = verticalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 100, top: 150 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(150);
        });

        it("should allow vertical movement", () => {
            const constraint = verticalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 50, top: 200 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(200);
        });

        it("should handle negative positions", () => {
            const constraint = verticalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: -100, top: -50 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(-50);
        });

        it("should handle zero start position", () => {
            const constraint = verticalAxisConstraint();
            const context = createMockContext({ left: 0, top: 0 }, { left: 100, top: 100 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(0);
            expect(result.top).toBe(100);
        });

        it("should handle same start and current position", () => {
            const constraint = verticalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 50, top: 50 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });
    });

    describe("horizontalAxisConstraint", () => {
        it("should return a constraint object with constrain method", () => {
            const constraint = horizontalAxisConstraint();
            expect(constraint).toHaveProperty("constrain");
            expect(typeof constraint.constrain).toBe("function");
        });

        it("should lock vertical movement (top stays at start position)", () => {
            const constraint = horizontalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 150, top: 100 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(150);
            expect(result.top).toBe(50);
        });

        it("should allow horizontal movement", () => {
            const constraint = horizontalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 200, top: 50 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(200);
            expect(result.top).toBe(50);
        });

        it("should handle negative positions", () => {
            const constraint = horizontalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: -100, top: -50 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(-100);
            expect(result.top).toBe(50);
        });

        it("should handle zero start position", () => {
            const constraint = horizontalAxisConstraint();
            const context = createMockContext({ left: 0, top: 0 }, { left: 100, top: 100 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(100);
            expect(result.top).toBe(0);
        });

        it("should handle same start and current position", () => {
            const constraint = horizontalAxisConstraint();
            const context = createMockContext({ left: 50, top: 50 }, { left: 50, top: 50 });

            const result = constraint.constrain(context);

            expect(result.left).toBe(50);
            expect(result.top).toBe(50);
        });
    });

    describe("combined constraints", () => {
        it("should be able to chain vertical then horizontal (results in no movement)", () => {
            const verticalConstraint = verticalAxisConstraint();
            const horizontalConstraint = horizontalAxisConstraint();

            const context = createMockContext({ left: 50, top: 50 }, { left: 150, top: 150 });

            const afterVertical = verticalConstraint.constrain(context);
            expect(afterVertical).toEqual({ left: 50, top: 150 });

            const contextAfterVertical = createMockContext({ left: 50, top: 50 }, afterVertical);
            const afterHorizontal = horizontalConstraint.constrain(contextAfterVertical);
            expect(afterHorizontal).toEqual({ left: 50, top: 50 });
        });
    });
});
