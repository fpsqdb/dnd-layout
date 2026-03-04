import type { BoundedConstraintOption, Position, Rectangle } from "../core/types";

export function applyBoundaryConstraint(
    itemRect: Rectangle,
    boundaryRect: Rectangle,
    currentPosition: Position,
    options?: BoundedConstraintOption,
): Position {
    const normalizedOptions = normalizeBoundedConstraintOption(options);
    let { left, top } = currentPosition;

    if (itemRect.left < boundaryRect.left) {
        if (normalizedOptions.left) {
            left += boundaryRect.left - itemRect.left;
        }
    } else if (itemRect.left + itemRect.width > boundaryRect.left + boundaryRect.width) {
        if (normalizedOptions.right) {
            left -= itemRect.left + itemRect.width - boundaryRect.left - boundaryRect.width;
            if (left < boundaryRect.left) {
                left = currentPosition.left;
            }
        }
    }

    if (itemRect.top < boundaryRect.top) {
        if (normalizedOptions.top) {
            top += boundaryRect.top - itemRect.top;
        }
    } else if (itemRect.top + itemRect.height > boundaryRect.top + boundaryRect.height) {
        if (normalizedOptions.bottom) {
            top -= itemRect.top + itemRect.height - boundaryRect.top - boundaryRect.height;
            if (top < boundaryRect.top) {
                top = currentPosition.top;
            }
        }
    }

    return { left, top };
}

/**
 * Normalize bounded constraint options - fills in missing directions with true defaults.
 */
export function normalizeBoundedConstraintOption(options?: BoundedConstraintOption): BoundedConstraintOption {
    return {
        top: options?.top !== false,
        right: options?.right !== false,
        bottom: options?.bottom !== false,
        left: options?.left !== false,
    };
}
