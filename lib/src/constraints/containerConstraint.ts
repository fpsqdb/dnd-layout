import type { BoundedConstraintOption, Constraint } from "../core/types";
import { applyBoundaryConstraint } from "./constraintUtils";

/**
 * Container constraint - ensures dragging items don't exceed container boundaries.
 */
export function containerConstraint(options?: BoundedConstraintOption): Constraint {
    return {
        constrain: (context) => {
            const { containerLocalRect, itemLocalRect, localPosition } = context;
            return applyBoundaryConstraint(itemLocalRect, containerLocalRect, localPosition, options);
        },
    };
}
