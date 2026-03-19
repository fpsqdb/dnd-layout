import type {
    ContentFitMode,
    LayoutAlgorithm,
    LayoutItem,
    MeasuredLayoutItem,
    RelayoutTrigger,
    RenderItem,
} from "../core/types";
import { isIntersecting, validatePositiveInteger, validateSpan } from "../core/utils";

const DEFAULT_LAYOUT_COLUMNS = 3;

export interface ColumnLayoutItem extends LayoutItem {
    /**
     * Zero-based start column index where the item is placed.
     */
    column: number;
    /**
     * Number of columns the item spans; clamped to a valid range during layout.
     */
    columnSpan: number;
    /**
     * Preferred item height in pixels (used when measured size is not available).
     */
    height: number;
}

export interface ColumnLayoutConfig {
    /**
     * Total number of columns in the layout; must be a positive integer.
     */
    columns: number;
}

class ColumnLayoutAlgorithm implements LayoutAlgorithm<ColumnLayoutItem> {
    #columns: number;
    constructor(config?: ColumnLayoutConfig) {
        this.#columns = validatePositiveInteger(config?.columns, 1, DEFAULT_LAYOUT_COLUMNS);
    }

    get className(): string {
        return "dnd-layout-column";
    }

    get containerTrigger(): RelayoutTrigger {
        return "width";
    }

    get itemTrigger(): RelayoutTrigger {
        return "height";
    }

    get contentFitMode(): ContentFitMode {
        return "height";
    }

    layout: LayoutAlgorithm<ColumnLayoutItem>["layout"] = (items, config) => {
        const { gap, layoutSize } = config;
        const [horizontalGap, verticalGap] = gap;
        const columns = this.#columns;

        const columnWidth = this.#getColumnWidth(columns, layoutSize.layoutWidth, horizontalGap);
        const columnHeights = new Float64Array(columns);

        const result: RenderItem<ColumnLayoutItem>[] = items.map((item) => {
            const columnSpan = validateSpan(item.columnSpan, columns);
            item.columnSpan = columnSpan;

            const width = columnSpan * columnWidth + (columnSpan - 1) * horizontalGap;

            let column = Math.floor(item.column);
            if (!Number.isFinite(column) || column < 0 || column + columnSpan > columns) {
                column = this.#findMinHeightColumn(columnHeights, columnSpan);
            }
            item.column = column;

            let itemHeight = item.height;
            if (!Number.isFinite(itemHeight) || itemHeight < 0) {
                itemHeight = 0;
            }
            if (item.size) {
                itemHeight = item.size.height;
            }

            let maxRealTop = 0;

            for (let i = column; i < column + columnSpan; i++) {
                maxRealTop = Math.max(maxRealTop, columnHeights[i]);
            }

            const top = maxRealTop > 0 ? maxRealTop + verticalGap : maxRealTop;
            const left = column * (columnWidth + horizontalGap);

            const currentBottom = top + itemHeight;

            for (let i = column; i < column + columnSpan; i++) {
                columnHeights[i] = currentBottom;
            }

            return {
                top,
                left,
                width,
                height: itemHeight,
                data: item,
            };
        });

        result.sort((a, b) => a.top - b.top || a.left - b.left);

        return result;
    };

    move: LayoutAlgorithm<ColumnLayoutItem>["move"] = (items, config, context) => {
        const { current, currentIndex, localPosition } = context;
        const { gap, layoutSize } = config;
        const [horizontalGap] = gap;

        const columns = this.#columns;
        const columnWidth = this.#getColumnWidth(columns, layoutSize.layoutWidth, horizontalGap);

        const movedColumns = this.#getMovedColumns(localPosition.left - current.left, columnWidth, horizontalGap);
        let predictedColumn = current.data.column + movedColumns;
        predictedColumn = Math.max(0, Math.min(predictedColumn, columns - current.data.columnSpan));
        const isColumnChanged = predictedColumn !== current.data.column;

        const isEdgeValid = (item: RenderItem<ColumnLayoutItem>) => {
            const isLeftEdgeValid =
                predictedColumn > current.data.column &&
                this.#hasColumnOverlap(
                    predictedColumn + current.data.columnSpan - 1,
                    1,
                    item.data.column,
                    item.data.columnSpan,
                );
            const isRightEdgeValid =
                predictedColumn < current.data.column &&
                this.#hasColumnOverlap(predictedColumn, 1, item.data.column, item.data.columnSpan);
            return isLeftEdgeValid || isRightEdgeValid;
        };

        let shadowItem: RenderItem<ColumnLayoutItem> | null = null;
        const createShadowItem = (top: number): RenderItem<ColumnLayoutItem> => {
            return {
                ...current,
                left: predictedColumn * (columnWidth + horizontalGap),
                top: top,
                data: {
                    ...current.data,
                    column: predictedColumn,
                },
            };
        };

        for (const item of items) {
            if (item.data.id === current.data.id) {
                continue;
            }
            if (isColumnChanged) {
                if (isEdgeValid(item) && isIntersecting({ ...current, ...localPosition }, item)) {
                    const itemMidY = item.top + item.height / 2;
                    if (localPosition.top > itemMidY) {
                        shadowItem = createShadowItem(item.top + item.height + 0.1);
                    } else {
                        shadowItem = createShadowItem(item.top - 0.1);
                    }
                    break;
                }
            } else {
                if (
                    this.#hasColumnOverlap(
                        predictedColumn,
                        current.data.columnSpan,
                        item.data.column,
                        item.data.columnSpan,
                    )
                ) {
                    const dragCenterY = localPosition.top + current.height / 2;
                    const targetCenterY = item.top + item.height / 2;
                    const threshold = item.height * 0.1;
                    if (localPosition.top > current.top) {
                        if (dragCenterY > targetCenterY + threshold && item.top > current.top) {
                            // moving down
                            shadowItem = createShadowItem(item.top + item.height + 0.1);
                        }
                    } else if (localPosition.top < current.top) {
                        if (dragCenterY < targetCenterY - threshold && item.top < current.top) {
                            // moving up
                            shadowItem = createShadowItem(item.top - 0.1);
                            break;
                        }
                    }
                }
            }
        }
        if (isColumnChanged && !shadowItem) {
            shadowItem = {
                ...current,
                left: predictedColumn * (columnWidth + horizontalGap),
                top: localPosition.top,
                data: {
                    ...current.data,
                    column: predictedColumn,
                },
            };
        }

        if (shadowItem) {
            return this.#getMovedItems([...items], currentIndex, shadowItem);
        }

        return false;
    };

    serialize: LayoutAlgorithm<ColumnLayoutItem>["serialize"] = (item) => {
        return {
            id: item.data.id,
            column: item.data.column,
            columnSpan: item.data.columnSpan,
            height: item.height,
        };
    };

    #getMovedItems = (
        items: RenderItem<MeasuredLayoutItem<ColumnLayoutItem>>[],
        index: number,
        shadowItem: RenderItem<MeasuredLayoutItem<ColumnLayoutItem>>,
    ) => {
        items.splice(index, 1);

        let low = 0;
        let high = items.length;

        while (low < high) {
            const mid = (low + high) >>> 1;
            const midItem = items[mid];

            if (midItem.top < shadowItem.top || (midItem.top === shadowItem.top && midItem.left < shadowItem.left)) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        items.splice(low, 0, shadowItem);
        return items.map((item) => item.data);
    };

    #findMinHeightColumn = (columnHeights: Float64Array, columnSpan: number): number => {
        let minMaxHeight = Infinity;
        let bestColumn = 0;

        for (let i = 0; i <= columnHeights.length - columnSpan; i++) {
            let maxInSpan = 0;
            for (let j = i; j < i + columnSpan; j++) {
                maxInSpan = Math.max(maxInSpan, columnHeights[j]);
            }

            if (maxInSpan < minMaxHeight) {
                minMaxHeight = maxInSpan;
                bestColumn = i;
            }
        }

        return bestColumn;
    };

    #getMovedColumns = (offset: number, columnWidth: number, horizontalGap: number): number => {
        const step = columnWidth + horizontalGap;
        if (step === 0) {
            return 0;
        }
        const sign = Math.sign(offset);
        const absOffset = Math.abs(offset);

        const fullSteps = Math.floor(absOffset / step);
        const remainder = absOffset % step;
        const extra = remainder > horizontalGap + columnWidth / 2 ? 1 : 0;

        return (fullSteps + extra) * sign;
    };

    #getColumnWidth = (columns: number, layoutWidth: number, horizontalGap: number): number => {
        return Math.max(0, layoutWidth > 0 ? (layoutWidth - horizontalGap * (columns - 1)) / columns : 0);
    };

    #hasColumnOverlap = (column1: number, columnSpan1: number, column2: number, columnSpan2: number) => {
        return column1 < column2 + columnSpan2 && column2 < column1 + columnSpan1;
    };
}

export function createColumnLayoutAlgorithm(config?: ColumnLayoutConfig): LayoutAlgorithm<ColumnLayoutItem> {
    return new ColumnLayoutAlgorithm(config);
}
