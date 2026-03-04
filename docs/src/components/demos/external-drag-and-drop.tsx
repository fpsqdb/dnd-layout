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
                { id: "7", column: 0, columnSpan: 2, height: 140 },
            ],
        };
    });

    const itemRender = (item: ColumnLayoutItem) => {
        const height = parseInt(item.id, 10) % 2 === 0 ? 280 : 140;
        return (
            <div
                className="common-layout-item"
                style={{
                    height,
                }}
            >
                {item.id}
            </div>
        );
    };

    const onDragEnter = (e: React.DragEvent, id: string) => {
        if (!e.dataTransfer.types.includes("application/drag-item")) {
            return false;
        }
        let height = 140;
        if (e.dataTransfer.types.includes("application/drag-item-height-2")) {
            height = 280;
        }
        const element: ColumnLayoutItem = {
            id,
            column: -1,
            columnSpan: 1,
            height,
        };
        return element;
    };

    const onDrop = (e: React.DragEvent, item: ColumnLayoutItem) => {
        if (!e.dataTransfer.types.includes("application/drag-item")) {
            return false;
        }
        const data = JSON.parse(e.dataTransfer.getData("application/drag-item"));
        if (data.type === "accept") {
            return item;
        }
        return false;
    };

    const onDragStart1 = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/drag-item", JSON.stringify({ type: "accept" }));
    };

    const onDragStart2 = (e: React.DragEvent) => {
        e.dataTransfer.setData("application/drag-item", JSON.stringify({ type: "reject" }));
        e.dataTransfer.setData("application/drag-item-height-2", "");
    };

    return (
        <>
            <div
                style={{
                    marginBottom: 12,
                    display: "flex",
                    gap: 12,
                }}
            >
                <div
                    role="none"
                    draggable={true}
                    style={{
                        border: "1px solid var(--dnd-layout-item-border-color)",
                        padding: 12,
                        borderRadius: 4,
                    }}
                    onDragStart={onDragStart1}
                >
                    Droppable Item (Accept)
                </div>
                <div
                    role="none"
                    draggable={true}
                    style={{
                        border: "1px solid var(--dnd-layout-item-border-color)",
                        padding: 12,
                        borderRadius: 4,
                    }}
                    onDragStart={onDragStart2}
                >
                    Droppable Item (Reject)
                </div>
                <div
                    draggable={true}
                    style={{
                        border: "1px solid var(--dnd-layout-item-border-color)",
                        padding: 12,
                        borderRadius: 4,
                    }}
                >
                    Droppable Item (Now Allowed)
                </div>
            </div>
            <DndLayout
                className="common-layout"
                layout={layout}
                layoutConfig={{
                    containerFitContentHeight: true,
                }}
                itemRender={itemRender}
                onDragEnter={onDragEnter}
                onDrop={onDrop}
            />
        </>
    );
}
