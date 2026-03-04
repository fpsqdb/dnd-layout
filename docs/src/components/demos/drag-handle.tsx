import { type ColumnLayoutItem, createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "./common-layout.css";

export function Sample() {
    const layout = useLayout(() => {
        return {
            algorithm: createColumnLayoutAlgorithm(),
            initialItems: [
                { id: "1", column: 0, columnSpan: 1, height: 140 },
                { id: "2", column: 1, columnSpan: 1, height: 140 },
                { id: "3", column: 2, columnSpan: 1, height: 140 },
                { id: "4", column: 0, columnSpan: 1, height: 140 },
                { id: "5", column: 1, columnSpan: 1, height: 140 },
                { id: "6", column: 2, columnSpan: 1, height: 140 },
            ],
        };
    });
    const itemRender = (item: ColumnLayoutItem) => {
        const height = parseInt(item.id, 10) % 2 === 0 ? 140 : 280;
        return (
            <div
                className="common-layout-item"
                style={{
                    height,
                }}
            >
                <div
                    className="drag-handle"
                    style={{
                        height: 32,
                        margin: "-12px -12px 0 -12px",
                        padding: "0 12px",
                        border: "0px solid var(--dnd-layout-item-border-color)",
                        borderBottomWidth: 1,
                    }}
                >
                    {item.id} drag-handle
                </div>
            </div>
        );
    };

    return (
        <DndLayout
            className="common-layout"
            layout={layout}
            layoutConfig={{
                containerFitContentHeight: true,
            }}
            dragConfig={{
                draggableSelector: ".drag-handle",
            }}
            itemRender={itemRender}
        />
    );
}
