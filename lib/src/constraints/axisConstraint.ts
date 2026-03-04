import type { Constraint } from "../core/types";

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
