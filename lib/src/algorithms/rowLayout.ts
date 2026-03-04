import type { LayoutAlgorithm, LayoutItem, MeasuredLayoutItem, RelayoutTrigger, RenderItem } from "../core/types";
import { isIntersecting, validatePositiveInteger, validateSpan } from "../core/utils";

const DEFAULT_LAYOUT_ROWS = 3;

export interface RowLayoutItem extends LayoutItem {
    /**
     * Zero-based start row index where the item is placed.
     */
    row: number;
    /**
     * Number of rows the item spans; clamped to a valid range during layout.
     */
    rowSpan: number;
    /**
     * Preferred item width in pixels (used when measured size is not available).
     */
    width: number;
}

export interface RowLayoutConfig {
    /**
     * Total number of rows in the layout; must be a positive integer.
     */
    rows: number;
}

class RowLayoutAlgorithm implements LayoutAlgorithm<RowLayoutItem> {
    #rows: number;
    constructor(config?: RowLayoutConfig) {
        this.#rows = validatePositiveInteger(config?.rows, 1, DEFAULT_LAYOUT_ROWS);
    }

    get className(): string {
        return "dnd-layout-row";
    }

    get containerTrigger(): RelayoutTrigger {
        return "height";
    }

    get itemTrigger(): RelayoutTrigger {
        return "width";
    }

    layout: LayoutAlgorithm<RowLayoutItem>["layout"] = (items, config) => {
        const { gap, layoutSize } = config;
        const [horizontalGap, verticalGap] = gap;
        const rows = this.#rows;

        const rowHeight = this.#getRowHeight(rows, layoutSize.layoutHeight, verticalGap);
        const rowWidths = new Float64Array(rows);

        const result: RenderItem<RowLayoutItem>[] = items.map((item) => {
            const rowSpan = validateSpan(item.rowSpan, rows);
            item.rowSpan = rowSpan;

            const height = rowSpan * rowHeight + (rowSpan - 1) * verticalGap;

            let row = Math.floor(item.row);
            if (!Number.isFinite(row) || row < 0 || row + rowSpan > rows) {
                row = this.#findMinWidthRow(rowWidths, rowSpan);
            }
            item.row = row;

            let itemWidth = item.width;
            if (!Number.isFinite(itemWidth) || itemWidth < 0) {
                itemWidth = 0;
            }
            if (item.size) {
                itemWidth = item.size.width;
            }

            let maxRealLeft = 0;

            for (let i = row; i < row + rowSpan; i++) {
                maxRealLeft = Math.max(maxRealLeft, rowWidths[i]);
            }

            const left = maxRealLeft > 0 ? maxRealLeft + horizontalGap : maxRealLeft;
            const top = row * (rowHeight + verticalGap);

            const currentRight = left + itemWidth;

            for (let i = row; i < row + rowSpan; i++) {
                rowWidths[i] = currentRight;
            }

            return {
                top,
                left,
                width: itemWidth,
                height,
                data: item,
            };
        });

        result.sort((a, b) => a.left - b.left || a.top - b.top);

        return result;
    };

    move: LayoutAlgorithm<RowLayoutItem>["move"] = (items, config, context) => {
        const { current, currentIndex, localPosition } = context;
        const { gap, layoutSize } = config;
        const [, verticalGap] = gap;

        const rows = this.#rows;
        const rowHeight = this.#getRowHeight(rows, layoutSize.layoutHeight, verticalGap);

        const movedRows = this.#getMovedRows(localPosition.top - current.top, rowHeight, verticalGap);
        let predictedRow = current.data.row + movedRows;
        predictedRow = Math.max(0, Math.min(predictedRow, rows - current.data.rowSpan));
        const isRowChanged = predictedRow !== current.data.row;

        const isEdgeValid = (item: RenderItem<RowLayoutItem>) => {
            const isTopEdgeValid =
                predictedRow > current.data.row &&
                this.#hasRowOverlap(predictedRow + current.data.rowSpan - 1, 1, item.data.row, item.data.rowSpan);
            const isBottomEdgeValid =
                predictedRow < current.data.row &&
                this.#hasRowOverlap(predictedRow, 1, item.data.row, item.data.rowSpan);
            return isTopEdgeValid || isBottomEdgeValid;
        };

        let shadowItem: RenderItem<RowLayoutItem> | null = null;
        const createShadowItem = (left: number): RenderItem<RowLayoutItem> => {
            return {
                ...current,
                left: left,
                top: predictedRow * (rowHeight + verticalGap),
                data: {
                    ...current.data,
                    row: predictedRow,
                },
            };
        };

        for (const item of items) {
            if (item.data.id === current.data.id) {
                continue;
            }
            if (isRowChanged) {
                if (isEdgeValid(item) && isIntersecting({ ...current, ...localPosition }, item)) {
                    const itemMidX = item.left + item.width / 2;
                    if (localPosition.left > itemMidX) {
                        shadowItem = createShadowItem(item.left + item.width + 0.1);
                    } else {
                        shadowItem = createShadowItem(item.left - 0.1);
                    }
                    break;
                }
            } else {
                if (this.#hasRowOverlap(predictedRow, current.data.rowSpan, item.data.row, item.data.rowSpan)) {
                    const dragCenterX = localPosition.left + current.width / 2;
                    const targetCenterX = item.left + item.width / 2;
                    const threshold = item.width * 0.1;
                    if (localPosition.left > current.left) {
                        if (dragCenterX > targetCenterX + threshold && item.left > current.left) {
                            // moving right
                            shadowItem = createShadowItem(item.left + item.width + 0.1);
                        }
                    } else if (localPosition.left < current.left) {
                        if (dragCenterX < targetCenterX - threshold && item.left < current.left) {
                            // moving left
                            shadowItem = createShadowItem(item.left - 0.1);
                            break;
                        }
                    }
                }
            }
        }
        if (isRowChanged && !shadowItem) {
            shadowItem = {
                ...current,
                left: localPosition.left,
                top: predictedRow * (rowHeight + verticalGap),
                data: {
                    ...current.data,
                    row: predictedRow,
                },
            };
        }

        if (shadowItem) {
            return this.#getMovedItems([...items], currentIndex, shadowItem);
        }

        return false;
    };

    serialize: LayoutAlgorithm<RowLayoutItem>["serialize"] = (item) => {
        return {
            id: item.data.id,
            row: item.data.row,
            rowSpan: item.data.rowSpan,
            width: item.width,
        };
    };

    #getMovedItems = (
        items: RenderItem<MeasuredLayoutItem<RowLayoutItem>>[],
        index: number,
        shadowItem: RenderItem<MeasuredLayoutItem<RowLayoutItem>>,
    ) => {
        items.splice(index, 1);

        let low = 0;
        let high = items.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            const midItem = items[mid];

            if (midItem.left < shadowItem.left || (midItem.left === shadowItem.left && midItem.top < shadowItem.top)) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        items.splice(low, 0, shadowItem);
        return items.map((item) => item.data);
    };

    #findMinWidthRow = (rowWidths: Float64Array, rowSpan: number): number => {
        let minMaxWidth = Infinity;
        let bestRow = 0;

        for (let i = 0; i <= rowWidths.length - rowSpan; i++) {
            let maxInSpan = 0;
            for (let j = i; j < i + rowSpan; j++) {
                maxInSpan = Math.max(maxInSpan, rowWidths[j]);
            }

            if (maxInSpan < minMaxWidth) {
                minMaxWidth = maxInSpan;
                bestRow = i;
            }
        }

        return bestRow;
    };

    #getMovedRows = (offset: number, rowHeight: number, verticalGap: number): number => {
        const step = rowHeight + verticalGap;
        if (step === 0) {
            return 0;
        }
        const sign = Math.sign(offset);
        const absOffset = Math.abs(offset);

        const fullSteps = Math.floor(absOffset / step);
        const remainder = absOffset % step;
        const extra = remainder > verticalGap + rowHeight / 2 ? 1 : 0;

        return (fullSteps + extra) * sign;
    };

    #getRowHeight = (rows: number, layoutHeight: number, verticalGap: number): number => {
        return Math.max(0, layoutHeight > 0 ? (layoutHeight - verticalGap * (rows - 1)) / rows : 0);
    };

    #hasRowOverlap = (row1: number, rowSpan1: number, row2: number, rowSpan2: number) => {
        return row1 < row2 + rowSpan2 && row2 < row1 + rowSpan1;
    };
}

export function createRowLayoutAlgorithm(config?: RowLayoutConfig): LayoutAlgorithm<RowLayoutItem> {
    return new RowLayoutAlgorithm(config);
}
