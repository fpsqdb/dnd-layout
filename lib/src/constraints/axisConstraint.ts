import type { Constraint } from "../core/types";

/**
 * Restricts movement to the vertical axis only (up and down).
 * Prevents any horizontal displacement.
 */
export function verticalAxisConstraint(): Constraint {
    return {
        constrain: (context) => {
            const { startLocalPosition, localPosition } = context;
            return {
                left: startLocalPosition.left,
                top: localPosition.top,
            };
        },
    };
}

/**
 * Restricts movement to the horizontal axis only (left and right).
 * Prevents any vertical displacement.
 */
export function horizontalAxisConstraint(): Constraint {
    return {
        constrain: (context) => {
            const { startLocalPosition, localPosition } = context;
            return {
                left: localPosition.left,
                top: startLocalPosition.top,
            };
        },
    };
}
