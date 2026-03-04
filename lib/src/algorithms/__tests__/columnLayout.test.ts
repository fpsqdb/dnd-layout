/** biome-ignore-all lint/style/noNonNullAssertion: ! */
import { beforeEach, describe, expect, it } from "vitest";
import type { LayoutRenderConfig, MeasuredLayoutItem } from "../../core/types";
import type { ColumnLayoutConfig, ColumnLayoutItem } from "../columnLayout";
import { createColumnLayoutAlgorithm } from "../columnLayout";

function createTestAlgorithm(config?: ColumnLayoutConfig) {
    return createColumnLayoutAlgorithm(config);
}

describe("ColumnLayoutAlgorithm", () => {
    let algorithm: ReturnType<typeof createColumnLayoutAlgorithm>;
    let renderConfig: LayoutRenderConfig;
    let testItems: ColumnLayoutItem[];

    beforeEach(() => {
        algorithm = createTestAlgorithm({ columns: 3 });
        renderConfig = {
            layoutSize: { layoutWidth: 300, layoutHeight: 600 },
            gap: [12, 12],
        };
        testItems = [
            { id: "1", column: 0, columnSpan: 1, height: 100 },
            { id: "2", column: 1, columnSpan: 1, height: 100 },
            { id: "3", column: 2, columnSpan: 1, height: 150 },
            { id: "4", column: 0, columnSpan: 1, height: 80 },
        ];
    });

    describe("Initialization", () => {
        it("should use default columns 3", () => {
            const algo = createTestAlgorithm();
            const result = algo.layout(testItems, renderConfig);
            const columnWidth = (300 - 2 * 12) / 3;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.width).toBe(columnWidth);
                }
            });
        });

        it("should accept custom columns configuration", () => {
            const algo = createTestAlgorithm({ columns: 5 });
            const result = algo.layout(testItems, renderConfig);
            const columnWidth = (300 - 4 * 12) / 5;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.width).toBe(columnWidth);
                }
            });
        });

        it("should validate columns must be positive integer", () => {
            const algo1 = createTestAlgorithm({ columns: -1 });
            const result1 = algo1.layout(testItems, renderConfig);
            expect(result1[0].width).toBe(92);
            const algo2 = createTestAlgorithm({ columns: 2.5 });
            const result2 = algo2.layout(testItems, renderConfig);
            expect(result2[0].width).toBe(92);
            const algo3 = createTestAlgorithm({ columns: 0 });
            const result3 = algo3.layout(testItems, renderConfig);
            expect(result3[0].width).toBe(92);
        });
    });

    describe("className", () => {
        it("should return correct CSS class name", () => {
            expect(algorithm.className).toBe("dnd-layout-column");
        });
    });

    describe("containerTrigger", () => {
        it("should return width as trigger", () => {
            expect(algorithm.containerTrigger).toBe("width");
        });
    });

    describe("itemTrigger", () => {
        it("should return height as trigger", () => {
            expect(algorithm.itemTrigger).toBe("height");
        });
    });

    describe("layout", () => {
        it("should return correct RenderItem array", () => {
            const result = algorithm.layout(testItems, renderConfig);
            expect(result).toHaveLength(4);
        });

        it("items in first row should have same top", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const firstRowTop = result[0].top;
            expect(result[1].top).toBe(firstRowTop);
            expect(result[2].top).toBe(firstRowTop);
        });

        it("should correctly calculate column width", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const columnWidth = (300 - 2 * 12) / 3;
            result.forEach((item, index) => {
                if (index < 3) {
                    expect(item.width).toBe(columnWidth);
                }
            });
        });

        it("should handle items spanning multiple columns", () => {
            const itemsWithSpan: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 2, height: 100 },
                { id: "2", column: 0, columnSpan: 1, height: 100 },
            ];
            const result = algorithm.layout(itemsWithSpan, renderConfig);
            expect(result[0].width).toBeGreaterThan(result[1].width);
        });

        it("should correctly arrange items", () => {
            const result = algorithm.layout(testItems, renderConfig);

            expect(result[0].left).toBeLessThan(result[1].left);
            expect(result[1].left).toBeLessThan(result[2].left);
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

        it("should normalize invalid columnSpan", () => {
            const itemsWithInvalidSpan: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 10, height: 100 },
                { id: "2", column: 0, columnSpan: 0, height: 100 },
                { id: "3", column: 0, columnSpan: -1, height: 100 },
            ];
            const result = algorithm.layout(itemsWithInvalidSpan, renderConfig);
            expect(result[0].data.columnSpan).toBe(3);
            expect(result[1].data.columnSpan).toBe(1);
            expect(result[2].data.columnSpan).toBe(1);
        });

        it("should normalize invalid column index", () => {
            const itemsWithInvalidColumn: ColumnLayoutItem[] = [
                { id: "1", column: 10, columnSpan: 1, height: 100 },
                { id: "2", column: -5, columnSpan: 1, height: 100 },
                { id: "3", column: 0, columnSpan: 1, height: 100 },
            ];
            const result = algorithm.layout(itemsWithInvalidColumn, renderConfig);
            expect(result[0].data.column).toBe(0);
            expect(result[1].data.column).toBe(1);
            expect(result[2].data.column).toBe(0);
        });

        it("should use item.height for layout calculation", () => {
            const itemsWithSize: ColumnLayoutItem[] = [{ id: "1", column: 0, columnSpan: 1, height: 200 }];
            const result = algorithm.layout(itemsWithSize, renderConfig);
            expect(result[0].height).toBe(200);
        });

        it("should correctly calculate vertical gap when maxRealTop is greater than 0", () => {
            const result = algorithm.layout(testItems, renderConfig);
            const secondRowTop = result[3].top;
            const firstRowBottomWithGap = testItems[0].height + renderConfig.gap[1];
            expect(secondRowTop).toBe(firstRowBottomWithGap);
        });

        it("should not apply vertical gap when maxRealTop is 0", () => {
            const items: ColumnLayoutItem[] = [{ id: "1", column: 0, columnSpan: 1, height: 0 }];
            const result = algorithm.layout(items, renderConfig);
            expect(result[0].top).toBe(0);
        });

        it("should correctly update columnHeights for spanned items", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 3, height: 100 },
                { id: "2", column: 0, columnSpan: 1, height: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);
            const item2 = result.find((item) => item.data.id === "2");
            expect(item2?.top).toBe(100 + renderConfig.gap[1]);
        });

        it("should sort items by top then by left", () => {
            const items: ColumnLayoutItem[] = [
                { id: "A", column: 0, columnSpan: 1, height: 50 },
                { id: "C", column: 0, columnSpan: 1, height: 50 },
                { id: "B", column: 1, columnSpan: 1, height: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);

            expect(result[0].data.id).toBe("A");
            expect(result[1].data.id).toBe("B");
            expect(result[2].data.id).toBe("C");

            expect(result[0].top).toBe(0);
            expect(result[0].left).toBe(0);

            expect(result[1].top).toBe(0);
            expect(result[1].left).toBeGreaterThan(0);

            expect(result[2].top).toBeGreaterThan(0);
            expect(result[2].left).toBe(0);
        });

        it("should correctly place item when initial column + columnSpan exceeds total columns", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 2, columnSpan: 1, height: 150 },
                { id: "4", column: 0, columnSpan: 1, height: 80 },
                { id: "5", column: 2, columnSpan: 2, height: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);
            const item5 = result.find((item) => item.data.id === "5");
            expect(item5?.data.column).toBe(1);
        });

        it("should validate and normalize item height", () => {
            const itemsWithInvalidHeight: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: NaN },
                { id: "2", column: 0, columnSpan: 1, height: Infinity },
                { id: "3", column: 0, columnSpan: 1, height: -50 },
            ];
            const result = algorithm.layout(itemsWithInvalidHeight, renderConfig);
            expect(result).toHaveLength(3);
            result.forEach((item) => {
                expect(item.height).toBe(0);
            });
        });

        it("should prioritize item.size.height over item.height", () => {
            const itemsWithSizedHeight: MeasuredLayoutItem<ColumnLayoutItem>[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100, size: { width: 50, height: 200 } },
            ];
            const result = algorithm.layout(itemsWithSizedHeight, renderConfig);
            expect(result[0].height).toBe(200);
        });

        it("should correctly calculate maxRealTop for spanned items", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 200 },
                { id: "3", column: 0, columnSpan: 2, height: 50 },
            ];
            const result = algorithm.layout(items, renderConfig);

            const item3 = result.find((item) => item.data.id === "3");
            expect(item3?.top).toBe(200 + renderConfig.gap[1]);
        });
    });

    describe("serialize", () => {
        it("should serialize layout item correctly", () => {
            const items: ColumnLayoutItem[] = [{ id: "1", column: 0, columnSpan: 1, height: 100 }];
            const layoutResult = algorithm.layout(items, renderConfig);
            const serialized = algorithm.serialize(layoutResult[0]);
            expect(serialized).toEqual({
                id: "1",
                column: 0,
                columnSpan: 1,
                height: 100,
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

        it("should return false if move is not enough to cause a column change", () => {
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

        it("should move item to a new column and return updated items", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left + 150, top: currentItem.top },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const item1 = result.find((item) => item.id === "1")!;
                expect(item1.column).toBe(1);
            }
        });

        it("should move item to a new column when shadowItem's top equals to other item's top", () => {
            const testItems2 = [
                { id: "1", column: 0, columnSpan: 1, height: 100.1 },
                { id: "2", column: 1, columnSpan: 1, height: 110.2 },
                { id: "3", column: 2, columnSpan: 1, height: 110.10000000000001 },
                { id: "4", column: 0, columnSpan: 1, height: 100 },
                { id: "5", column: 1, columnSpan: 1, height: 110 },
                { id: "6", column: 2, columnSpan: 1, height: 110 },
            ];
            const layoutResult = algorithm.layout(testItems2, {
                layoutSize: { layoutWidth: 300, layoutHeight: 600 },
                gap: [0, 0],
            });
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 3,
                localPosition: { left: currentItem.left + 150, top: currentItem.top + 11 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const item1 = result.find((item) => item.id === "4")!;
                expect(item1.column).toBe(1);
            }
        });

        it("should swap items within the same column", () => {
            const items = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 0, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[1];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left, top: targetItem.top + 20 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("2");
                expect(result[1].id).toBe("1");
            }
        });

        it("should swap items when moving to a different column", () => {
            const layoutResult = algorithm.layout(testItems, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[1];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: targetItem.left + 10, top: targetItem.top + 60 },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const movedItem = result.find((item) => item.id === "1");
                expect(movedItem?.column).toBe(1);

                const movedItemIndex = result.findIndex((i) => i.id === "1");
                const originalItemIndex = result.findIndex((i) => i.id === "2");
                expect(movedItemIndex).toBeGreaterThan(originalItemIndex);
            }
        });

        it("should correctly reorder items and return new data array", () => {
            const items = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 2, columnSpan: 1, height: 150 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult[0];
            const targetItem = layoutResult[2];

            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: targetItem.left, top: targetItem.top + targetItem.height + 20 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result).toHaveLength(3);
                expect(result[0].id).toBe("2");
                expect(result[1].id).toBe("3");
                expect(result[2].id).toBe("1");
                expect(result[2].column).toBe(2);
            }
        });

        it("should trigger isEdgeValid when moving an item to an overlapping column position", () => {
            const items: ColumnLayoutItem[] = [
                { id: "A", column: 0, columnSpan: 2, height: 100 },
                { id: "B", column: 1, columnSpan: 1, height: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const currentItem = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: currentItem,
                currentIndex: layoutResult.indexOf(currentItem),
                localPosition: {
                    left: itemB.left + 10,
                    top: currentItem.top,
                },
            };
            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const movedItem = result.find((item) => item.id === "A");
                expect(movedItem?.column).toBe(1);
            }
        });

        it("should create shadowItem below target when moving down and isColumnChanged is true", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 0, columnSpan: 1, height: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;
            const item2 = layoutResult.find((item) => item.data.id === "2")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item2.left, top: item2.top + item2.height / 2 + 1 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);

                expect(shadow?.top).toBe(item2.top + item2.height + renderConfig.gap[1]);
                expect(shadow?.data.column).toBe(1);
            }
        });

        it("should create shadowItem above target when moving up and isColumnChanged is true", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 0, columnSpan: 1, height: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;
            const item2 = layoutResult.find((item) => item.data.id === "2")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item2.left, top: item2.top + item2.height / 2 - 1 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);

                expect(shadow?.top).toBe(0);
                expect(shadow?.data.column).toBe(1);
            }
        });

        it("should reorder items when moving down within the same column", () => {
            const items: ColumnLayoutItem[] = [
                { id: "A", column: 0, columnSpan: 1, height: 100 },
                { id: "B", column: 0, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemA,
                currentIndex: layoutResult.indexOf(itemA),
                localPosition: { left: itemA.left, top: itemB.top + itemB.height / 2 + 1 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("B");
                expect(result[1].id).toBe("A");
            }
        });

        it("should reorder items when moving up within the same column", () => {
            const items = [
                { id: "A", column: 0, columnSpan: 1, height: 100 },
                { id: "B", column: 0, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemB,
                currentIndex: layoutResult.indexOf(itemB),
                localPosition: { left: itemB.left, top: -100 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("B");
                expect(result[1].id).toBe("A");
            }
        });

        it("should not reorder if dragCenterY is within threshold when moving down", () => {
            const items: ColumnLayoutItem[] = [
                { id: "A", column: 0, columnSpan: 1, height: 100 },
                { id: "B", column: 0, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;

            const context = {
                current: itemA,
                currentIndex: layoutResult.indexOf(itemA),
                localPosition: { left: itemA.left, top: 120 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should not reorder if dragCenterY is within threshold when moving up", () => {
            const items: ColumnLayoutItem[] = [
                { id: "A", column: 0, columnSpan: 1, height: 100 },
                { id: "B", column: 0, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const itemA = layoutResult.find((item) => item.data.id === "A")!;
            const itemB = layoutResult.find((item) => item.data.id === "B")!;

            const context = {
                current: itemB,
                currentIndex: layoutResult.indexOf(itemB),
                localPosition: { left: itemB.left, top: itemA.top + itemA.height / 2 + (itemA.height * 0.1) / 2 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).toBe(false);
        });

        it("should create fallback shadowItem when column changes but no intersection-based shadowItem is created", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;

            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item1.left + 200, top: 500 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                const newRenderItems = algorithm.layout(result, renderConfig);
                const shadow = newRenderItems.find((item) => item.data.id === item1.data.id);

                expect(shadow?.data.column).toBe(2);
                expect(shadow?.top).toBe(0);
            }
        });

        it("should trigger both isLeftEdgeValid and isRightEdgeValid branches in isEdgeValid", () => {
            const items: ColumnLayoutItem[] = [
                { id: "1", column: 1, columnSpan: 1, height: 100 },
                { id: "2", column: 0, columnSpan: 3, height: 50 },
            ];
            const layoutResult = algorithm.layout(items, renderConfig);
            const item1 = layoutResult.find((item) => item.data.id === "1")!;

            // First, test isLeftEdgeValid branch (predictedColumn > current.data.column)
            const context = {
                current: item1,
                currentIndex: layoutResult.indexOf(item1),
                localPosition: { left: item1.left + 200, top: item1.top + 10 },
            };

            const result = algorithm.move(layoutResult, renderConfig, context);
            expect(result).not.toBe(false);

            // Then, test isRightEdgeValid branch (predictedColumn < current.data.column)
            const items2: ColumnLayoutItem[] = [
                { id: "3", column: 1, columnSpan: 1, height: 100 },
                { id: "4", column: 0, columnSpan: 3, height: 50 },
            ];
            const layoutResult2 = algorithm.layout(items2, renderConfig);
            const item3 = layoutResult2.find((item) => item.data.id === "3")!;

            const context2 = {
                current: item3,
                currentIndex: layoutResult2.indexOf(item3),
                localPosition: { left: item3.left - 200, top: item3.top + 10 },
            };

            const result2 = algorithm.move(layoutResult2, renderConfig, context2);
            expect(result2).not.toBe(false);
        });

        it("should handle zero layout width scenario", () => {
            const zeroWidthConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 0, layoutHeight: 600 },
                gap: [12, 12],
            };

            const layoutResult = algorithm.layout(testItems, zeroWidthConfig);
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left + 100, top: currentItem.top + 10 },
            };

            const result = algorithm.move(layoutResult, zeroWidthConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[3].id).toBe("4");
                expect(result[3].column).toBe(2);
            }
        });

        it("should handle columnWidth + horizontalGap equals 0", () => {
            const tinyConfig: LayoutRenderConfig = {
                layoutSize: { layoutWidth: 0, layoutHeight: 600 },
                gap: [0, 12],
            };
            const layoutResult = algorithm.layout(testItems, tinyConfig);
            const currentItem = layoutResult[3];
            const context = {
                current: currentItem,
                currentIndex: 0,
                localPosition: { left: currentItem.left + 100, top: currentItem.top - 150 },
            };
            const result = algorithm.move(layoutResult, tinyConfig, context);
            expect(result).not.toBe(false);
            if (result) {
                expect(result[0].id).toBe("4");
                expect(result[0].column).toBe(0);
            }
        });
    });
});
