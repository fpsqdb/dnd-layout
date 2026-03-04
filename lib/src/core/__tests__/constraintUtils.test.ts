import { describe, expect, it } from "vitest";
import { applyBoundaryConstraint, normalizeBoundedConstraintOption } from "../../constraints/constraintUtils";
import type { Rectangle } from "../types";

describe("constraintUtils", () => {
    describe("applyBoundaryConstraint", () => {
        const containerRect: Rectangle = {
            left: 0,
            top: 0,
            width: 100,
            height: 100,
        };

        it("should not modify position when item is inside container", () => {
            const itemRect: Rectangle = {
                left: 10,
                top: 10,
                width: 30,
                height: 30,
            };
            const position = { left: 50, top: 50 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result).toEqual({ left: 50, top: 50 });
        });

        it("should adjust right when item exceeds left boundary", () => {
            const itemRect: Rectangle = {
                left: -10,
                top: 10,
                width: 30,
                height: 30,
            };
            const position = { left: -10, top: 50 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result.left).toBe(0);
            expect(result.top).toBe(50);
        });

        it("should adjust left when item exceeds right boundary", () => {
            const itemRect: Rectangle = {
                left: 80,
                top: 10,
                width: 30,
                height: 30,
            };
            const position = { left: 80, top: 50 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result.left).toBe(70);
            expect(result.top).toBe(50);
        });

        it("should adjust down when item exceeds top boundary", () => {
            const itemRect: Rectangle = {
                left: 10,
                top: -10,
                width: 30,
                height: 30,
            };
            const position = { left: 50, top: -10 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result.left).toBe(50);
            expect(result.top).toBe(0);
        });

        it("should adjust up when item exceeds bottom boundary", () => {
            const itemRect: Rectangle = {
                left: 10,
                top: 80,
                width: 30,
                height: 30,
            };
            const position = { left: 50, top: 80 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result.left).toBe(50);
            expect(result.top).toBe(70);
        });

        it("should handle overflow in all four corners", () => {
            const itemRect: Rectangle = {
                left: -10,
                top: -10,
                width: 120,
                height: 120,
            };
            const position = { left: -10, top: -10 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position);
            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });

        it("should respect disabled options", () => {
            const itemRect: Rectangle = {
                left: -10,
                top: -10,
                width: 30,
                height: 30,
            };
            const position = { left: -10, top: -10 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position, { left: false, top: false });
            expect(result).toEqual({ left: -10, top: -10 });
        });

        it("should partially respect disabled options", () => {
            const itemRect: Rectangle = {
                left: -10,
                top: -10,
                width: 30,
                height: 30,
            };
            const position = { left: -10, top: -10 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position, { left: false, top: true });
            expect(result.left).toBe(-10);
            expect(result.top).toBe(0);
        });

        it("should handle empty options object", () => {
            const itemRect: Rectangle = {
                left: -10,
                top: -10,
                width: 30,
                height: 30,
            };
            const position = { left: -10, top: -10 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position, {});
            expect(result.left).toBe(0);
            expect(result.top).toBe(0);
        });

        it("should not adjust left when item exceeds right boundary if right option is false", () => {
            const itemRect: Rectangle = {
                left: 80,
                top: 10,
                width: 30,
                height: 30,
            };
            const position = { left: 80, top: 50 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position, { right: false });
            expect(result.left).toBe(80);
            expect(result.top).toBe(50);
        });

        it("should not adjust top when item exceeds bottom boundary if bottom option is false", () => {
            const itemRect: Rectangle = {
                left: 10,
                top: 80,
                width: 30,
                height: 30,
            };
            const position = { left: 50, top: 80 };

            const result = applyBoundaryConstraint(itemRect, containerRect, position, { bottom: false });
            expect(result.left).toBe(50);
            expect(result.top).toBe(80);
        });
    });

    describe("normalizeBoundedConstraintOption", () => {
        it("should default all values to true", () => {
            const result = normalizeBoundedConstraintOption();
            expect(result).toEqual({
                top: true,
                right: true,
                bottom: true,
                left: true,
            });
        });

        it("should retain specified false values", () => {
            const result = normalizeBoundedConstraintOption({ left: false });
            expect(result).toEqual({
                top: true,
                right: true,
                bottom: true,
                left: false,
            });
        });

        it("should handle multiple false values", () => {
            const result = normalizeBoundedConstraintOption({
                left: false,
                top: false,
                right: true,
            });
            expect(result).toEqual({
                top: false,
                right: true,
                bottom: true,
                left: false,
            });
        });

        it("should handle all false values", () => {
            const result = normalizeBoundedConstraintOption({
                top: false,
                right: false,
                bottom: false,
                left: false,
            });
            expect(result).toEqual({
                top: false,
                right: false,
                bottom: false,
                left: false,
            });
        });

        it("should handle undefined values", () => {
            const result = normalizeBoundedConstraintOption({
                top: undefined as unknown as boolean,
            });
            expect(result.top).toBe(true);
        });
    });
});
