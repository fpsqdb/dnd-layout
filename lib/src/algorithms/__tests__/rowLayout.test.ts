/** biome-ignore-all lint/style/noNonNullAssertion: ! */
import { beforeEach, describe, expect, it } from "vitest";
import type { LayoutRenderConfig, MeasuredLayoutItem } from "../../core/types";
import type { RowLayoutConfig, RowLayoutItem } from "../rowLayout";
import { createRowLayoutAlgorithm } from "../rowLayout";

function createTestAlgorithm(config?: RowLayoutConfig) {
    return createRowLayoutAlgorithm(config);
}

describe("RowLayoutAlgorithm", () => {
    let algorithm: ReturnType<typeof createRowLayoutAlgorithm>;
    let renderConfig: LayoutRenderConfig;
    let testItems: RowLayoutItem[];

    beforeEach(() => {
        algorithm = createTestAlgorithm({ rows: 3 });
        renderConfig = {
            layoutSize: { layoutWidth: 600, layoutHeight: 300 },
            gap: [12, 12] as const,
        };
        testItems = [
            { id: "1", row: 0, rowSpan: 1, width: 100 },
            { id: "2", row: 1, rowSpan: 1, width: 100 },
            { id: "3", row: 2, rowSpan: 1, width: 150 },
            { id: "4", row: 0, rowSpan: 1, width: 80 },
        ];
    });

    describe("Initialization", () => {
        it("should use default rows 3", () => {
            const algo = createTestAlgorithm();
            const result = algo.layout(testItems, renderConfig);
            const columnHeight = (300 - 2 * 12) / 3;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.height).toBe(columnHeight);
                }
            });
        });

        it("should accept custom rows configuration", () => {
            const algo = createTestAlgorithm({ rows: 5 });
            const result = algo.layout(testItems, renderConfig);
            const columnHeight = (300 - 4 * 12) / 5;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.height).toBe(columnHeight);
                }
            });
        });

        it("should validate rows must be positive integer", () => {
            const algo1 = createTestAlgorithm({ rows: -1 });
            const result1 = algo1.layout(testItems, renderConfig);
            expect(result1[0].height).toBe(92);
            const algo2 = createTestAlgorithm({ rows: 2.5 });
            const result2 = algo2.layout(testItems, renderConfig);
            expect(result2[0].height).toBe(92);
            const algo3 = createTestAlgorithm({ rows: 0 });
            const result3 = algo3.layout(testItems, renderConfig);
            expect(result3[0].height).toBe(92);
        });
    });

    describe("className", () => {
        it("should return correct CSS class name", () => {
            expect(algorithm.className).toBe("dnd-layout-row");
        });
    });

    describe("containerTrigger", () => {
        it("should return height as trigger", () => {
            expect(algorithm.containerTrigger).toBe("height");
        });
    });

    describe("itemTrigger", () => {
        it("should return width as trigger", () => {
            expect(algorithm.itemTrigger).toBe("width");
        });
    });

    describe("layout", () => {
        it("should return correct RenderItem array", () => {
            const result = algorithm.layout(testItems, renderConfig);
            expect(result).toHaveLength(4);
        });

        it("items in first column should have same left", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const firstColLeft = result[0].left;
            expect(result[1].left).toBe(firstColLeft);
            expect(result[2].left).toBe(firstColLeft);
        });

        it("should correctly calculate row height", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const rowHeight = (300 - 2 * 12) / 3;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.height).toBe(rowHeight);
                }
            });
        });

        it("should handle items spanning multiple rows", () => {
            const itemsWithSpan: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 2, width: 100 },
                { id: "2", row: 0, rowSpan: 1, width: 100 },
            ];
            const result = algorithm.layout(itemsWithSpan, renderConfig);
            expect(result[0].height).toBeGreaterThan(result[1].height);
        });

        it("should correctly arrange items", () => {
            const result = algorithm.layout(testItems, renderConfig);

            expect(result[0].top).toBeLessThan(result[1].top);
            expect(result[1].top).toBeLessThan(result[2].top);
        });

        it("should handle empty items array", () => {
            const result = algorithm.layout([], renderConfig);
            expect(result).toHaveLength(0);
        });

        it("should handle single item", () => {
            const result = algorithm.layout([testItems[0]], renderConfig);
            expect(result).toHaveLength(1);
            expect(result[0].left).toBe(0);
            expect(result[0].top).toBe(0);
        });

        it("should normalize invalid rowSpan", () => {
            const itemsWithInvalidSpan: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 10, width: 100 },
                { id: "2", row: 0, rowSpan: 0, width: 100 },
                { id: "3", row: 0, rowSpan: -1, width: 100 },
            ];
            const result = algorithm.layout(itemsWithInvalidSpan, renderConfig);
            expect(result[0].data.rowSpan).toBe(3);
            expect(result[1].data.rowSpan).toBe(1);
            expect(result[2].data.rowSpan).toBe(1);
        });

        it("should normalize invalid row index", () => {
            const itemsWithInvalidRow: RowLayoutItem[] = [
                { id: "1", row: 10, rowSpan: 1, width: 100 },
                { id: "2", row: -5, rowSpan: 1, width: 100 },
                { id: "3", row: 0, rowSpan: 1, width: 100 },
            ];
            const result = algorithm.layout(itemsWithInvalidRow, renderConfig);
            expect(result[0].data.row).toBe(0);
            expect(result[1].data.row).toBe(1);
            expect(result[2].data.row).toBe(0);
        });

        it("should use item.width for layout calculation", () => {
            const itemsWithSize: RowLayoutItem[] = [{ id: "1", row: 0, rowSpan: 1, width: 200 }];
            const result = algorithm.layout(itemsWithSize, renderConfig);
            expect(result[0].width).toBe(200);
        });

        it("should correctly calculate horizontal gap when maxRealLeft is greater than 0", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const secondColLeft = result[3].left;
            const firstColRightWithGap = testItems[0].width + renderConfig.gap[0];
            expect(secondColLeft).toBe(firstColRightWithGap);
        });

        it("should not apply horizontal gap when maxRealLeft is 0", () => {
            const items: RowLayoutItem[] = [{ id: "1", row: 0, rowSpan: 1, width: 0 }];
            const result = algorithm.layout(items, renderConfig);
            expect(result[0].left).toBe(0);
        });

        it("should correctly update rowWidths for spanned items", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 3, width: 100 },
                { id: "2", row: 0, rowSpan: 1, width: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);
            const item2 = result.find((item) => item.data.id === "2");
            expect(item2?.left).toBe(100 + renderConfig.gap[0]);
        });

        it("should sort items by left then by top", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 1, width: 50 },
                { id: "C", row: 0, rowSpan: 1, width: 50 },
                { id: "B", row: 1, rowSpan: 1, width: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);

            expect(result[0].data.id).toBe("A");
            expect(result[1].data.id).toBe("B");
            expect(result[2].data.id).toBe("C");

            expect(result[0].left).toBe(0);
            expect(result[0].top).toBe(0);

            expect(result[1].left).toBe(0);
            expect(result[1].top).toBeGreaterThan(0);

            expect(result[2].left).toBeGreaterThan(0);
            expect(result[2].top).toBe(0);
        });

        it("should correctly place item when initial row + rowSpan exceeds total rows", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
                { id: "3", row: 2, rowSpan: 1, width: 150 },
                { id: "4", row: 0, rowSpan: 1, width: 80 },
                { id: "5", row: 2, rowSpan: 2, width: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);
            const item5 = result.find((item) => item.data.id === "5");
            expect(item5?.data.row).toBe(1);
        });

        it("should validate and normalize item width", () => {
            const itemsWithInvalidWidth: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: NaN },
                { id: "2", row: 0, rowSpan: 1, width: Infinity },
                { id: "3", row: 0, rowSpan: 1, width: -50 },
            ];
            const result = algorithm.layout(itemsWithInvalidWidth, renderConfig);
            expect(result).toHaveLength(3);
            result.forEach((item) => {
                expect(item.width).toBe(0);
            });
        });

        it("should prioritize item.size.width over item.width", () => {
            const itemsWithSizedWidth: MeasuredLayoutItem<RowLayoutItem>[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100, size: { height: 50, width: 200 } },
            ];
            const result = algorithm.layout(itemsWithSizedWidth, renderConfig);
            expect(result[0].width).toBe(200);
        });

        it("should correctly calculate maxRealLeft for spanned items", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 200 },
                { id: "3", row: 0, rowSpan: 2, width: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);

            const item3 = result.find((item) => item.data.id === "3");
            expect(item3?.left).toBe(200 + renderConfig.gap[0]);
        });
    });

    describe("serialize", () => {
        it("should serialize layout item correctly", () => {
            const items: RowLayoutItem[] = [{ id: "1", row: 0, rowSpan: 1, width: 100 }];
            const layoutResult = algorithm.layout(items, renderConfig);
            const serialized = algorithm.serialize(layoutResult[0]);
            expect(serialized).toEqual({
                id: "1",
                row: 0,
                rowSpan: 1,
                width: 100,
            });
        });
    });

    describe("move", () => {
        it("should return false if is not move", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left, top: currentItem.top },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should return false if move is not enough to cause a row change", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left + 10, top: currentItem.top + 10 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should move item to a new row and return updated items", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left, top: currentItem.top + 150 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const item1 = result.find((item) => item.id === "1")!;
                expect(item1.row).toBe(1);
            }
        });

        it("should move item to a new row when shadowItem's left equals to other item's left", () => {
            const testItems2 = [
                { id: "1", row: 0, rowSpan: 1, width: 100.1 },
                { id: "2", row: 1, rowSpan: 1, width: 110.2 },
                { id: "3", row: 2, rowSpan: 1, width: 110.10000000000001 },
                { id: "4", row: 0, rowSpan: 1, width: 100 },
                { id: "5", row: 1, rowSpan: 1, width: 110 },
                { id: "6", row: 2, rowSpan: 1, width: 110 },
            ];
            const layoutResult = algorithm.layout(testItems2, {
                layoutSize: { layoutWidth: 600, layoutHeight: 300 },
                gap: [0, 0],
            });
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 3,
                localPosition: { left: currentItem.left + 11, top: currentItem.top + 150 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const item1 = result.find((item) => item.id === "4");
                expect(item1?.row).toBe(1);
            }
        });

        it("should swap items within the same row", () => {
            const items = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 0, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[1];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: targetItem.left + 20, top: currentItem.top },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("2");
                expect(result[1].id).toBe("1");
            }
        });

        it("should swap items when moving to a different row", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[1];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: targetItem.left + 60, top: targetItem.top + 10 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const movedItem = result.find((item) => item.id === "1");
                expect(movedItem?.row).toBe(1);

                const movedItemIndex = result.findIndex((i) => i.id === "1");
                const originalItemIndex = result.findIndex((i) => i.id === "2");
                expect(movedItemIndex).toBeGreaterThan(originalItemIndex);
            }
        });

        it("should correctly reorder items and return new data array", () => {
            const items = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
                { id: "3", row: 2, rowSpan: 1, width: 150 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[2];

            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: targetItem.left + targetItem.width + 20, top: targetItem.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result).toHaveLength(3);
                expect(result[0].id).toBe("2");
                expect(result[1].id).toBe("3");
                expect(result[2].id).toBe("1");
                expect(result[2].row).toBe(2);
            }
        });

        it("should trigger isEdgeValid when moving an item to an overlapping row position", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 2, width: 100 },
                { id: "B", row: 1, rowSpan: 1, width: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: currentItem,
                currentIndex: layoutResult.indexOf(currentItem),
                localPosition: {
                    left: currentItem.left,
                    top: itemB.top + 10,
                },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const movedItem = result.find((item) => item.id === "A");
                expect(movedItem?.row).toBe(1);
            }
        });

        it("should create shadowItem to the right of target when moving right and isRowChanged is true", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
                { id: "3", row: 0, rowSpan: 1, width: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;
            const item2 = layoutResult.find((item) => item.data.id === "2")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item2.left + item2.width / 2 + 1, top: item2.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);
                expect(shadow?.left).toBe(item2.left + item2.width + renderConfig.gap[0]);
                expect(shadow?.data.row).toBe(1);
            }
        });

        it("should create shadowItem to the left of target when moving left and isRowChanged is true", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
                { id: "3", row: 0, rowSpan: 1, width: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;
            const item2 = layoutResult.find((item) => item.data.id === "2")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item2.left + item2.width / 2 - 1, top: item2.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);
                expect(shadow?.left).toBe(0);
                expect(shadow?.data.row).toBe(1);
            }
        });

        it("should reorder items when moving right within the same row", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 1, width: 100 },
                { id: "B", row: 0, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemA,
                currentIndex: layoutResult.indexOf(itemA),
                localPosition: { left: itemB.left + itemB.width / 2 + 1, top: itemA.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("B");
                expect(result[1].id).toBe("A");
            }
        });

        it("should reorder items when moving left within the same row", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 1, width: 100 },
                { id: "B", row: 0, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemB,
                currentIndex: layoutResult.indexOf(itemB),
                localPosition: { left: -100, top: itemB.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("B");
                expect(result[1].id).toBe("A");
            }
        });

        it("should not reorder if dragCenterX is within threshold when moving right", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 1, width: 100 },
                { id: "B", row: 0, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;

            const context = {
                current: itemA,
                currentIndex: layoutResult.indexOf(itemA),
                localPosition: { left: 120, top: itemA.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should not reorder if dragCenterX is within threshold when moving left", () => {
            const items: RowLayoutItem[] = [
                { id: "A", row: 0, rowSpan: 1, width: 100 },
                { id: "B", row: 0, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemB,
                currentIndex: layoutResult.indexOf(itemB),
                localPosition: { left: itemA.left + itemA.width / 2 + (itemA.width * 0.1) / 2, top: itemB.top },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should create fallback shadowItem when row changes but no intersection-based shadowItem is created", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: 500, top: item1.top + 200 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);

                expect(shadow?.data.row).toBe(2);
                expect(shadow?.left).toBe(0);
            }
        });

        it("should trigger both isTopEdgeValid and isBottomEdgeValid branches in isEdgeValid", () => {
            const items: RowLayoutItem[] = [
                { id: "1", row: 1, rowSpan: 1, width: 100 },
                { id: "2", row: 0, rowSpan: 3, width: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;

            // First, test isTopEdgeValid branch (predictedRow > current.data.row)
            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item1.left + 10, top: item1.top + 200 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);

            // Then, test isBottomEdgeValid branch (predictedRow < current.data.row)
            const items2: RowLayoutItem[] = [
                { id: "3", row: 1, rowSpan: 1, width: 100 },
                { id: "4", row: 0, rowSpan: 3, width: 50 },
            ];
            const layoutResult2 = algorithm.layout(items2, renderConfig);
            const item3 = layoutResult2.find((item) => item.data.id === "3")!;

            const context2 = {
                current: item3,
                currentIndex: layoutResult2.indexOf(item3),
                localPosition: { left: item3.left + 10, top: item3.top - 200 },
            };

            const result2 = algorithm.move(layoutResult2, renderConfig, context2);
            expect(result2).not.toBe(false);
        });

        it("should handle zero layout height scenario", () => {
            const zeroHeightConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 600, layoutHeight: 0 },
                gap: [12, 12],
            };

            const layoutResult = algorithm.layout(testItems, zeroHeightConfig);
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left + 10, top: currentItem.top + 100 },
            };

            const result = algorithm.move(layoutResult, zeroHeightConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[3].id).toBe("4");
                expect(result[3].row).toBe(2);
            }
        });

        it("should handle rowHeight + verticalGap equals 0", () => {
            const tinyConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 600, layoutHeight: 0 },
                gap: [12, 0],
            };
            const layoutResult = algorithm.layout(testItems, tinyConfig);
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left - 150, top: currentItem.top + 100 },
            };
            const result = algorithm.move(layoutResult, tinyConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("4");
                expect(result[0].row).toBe(0);
            }
        });
    });
});
