import type { BoundedConstraintOption, Constraint } from "../core/types";
import { applyBoundaryConstraint } from "./constraintUtils";

/**
 * Window constraint - ensures dragging items don't exceed window boundaries.
 */
export function windowConstraint(options?: BoundedConstraintOption): Constraint {
    return {
        constrain: (context) => {
            const { windowRect, itemGlobalRect, globalPosition, globalPositionToLocalPosition } = context;
            const constrainedGlobalPosition = applyBoundaryConstraint(
                itemGlobalRect,
                windowRect,
                globalPosition,
                options,
            );
            return globalPositionToLocalPosition(constrainedGlobalPosition);
        },
    };
}
