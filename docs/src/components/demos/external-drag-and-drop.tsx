import { type ColumnLayoutItem, createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "./common-layout.css";
import { useRef } from "react";

type DraggingItemData = {
    type: "accept" | "reject";
    height: number;
};

export function Sample() {
    const draggingItemDataRef = useRef<DraggingItemData>(null);
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

    const onDragEnter = (_e: React.DragEvent, id: string) => {
        const data = draggingItemDataRef.current;
        if (!data) {
            return false;
        }
        const element: ColumnLayoutItem = {
            id,
            column: -1,
            columnSpan: 1,
            height: data.height,
        };
        return element;
    };

    const onDrop = (_e: React.DragEvent, item: ColumnLayoutItem) => {
        const data = draggingItemDataRef.current;
        if (!data) {
            return false;
        }
        if (data.type === "accept") {
            return item;
        }
        return false;
    };

    const onDragStart1 = () => {
        draggingItemDataRef.current = {
            type: "accept",
            height: 140,
        };
    };

    const onDragStart2 = () => {
        draggingItemDataRef.current = {
            type: "reject",
            height: 280,
        };
    };

    const onDragStart3 = () => {
        draggingItemDataRef.current = null;
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
                        touchAction: "none",
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
                        touchAction: "none",
                        border: "1px solid var(--dnd-layout-item-border-color)",
                        padding: 12,
                        borderRadius: 4,
                    }}
                    onDragStart={onDragStart2}
                >
                    Droppable Item (Reject)
                </div>
                <div
                    role="none"
                    draggable={true}
                    style={{
                        touchAction: "none",
                        border: "1px solid var(--dnd-layout-item-border-color)",
                        padding: 12,
                        borderRadius: 4,
                    }}
                    onDragStart={onDragStart3}
                >
                    Droppable Item (Now Allowed)
                </div>
            </div>
            <DndLayout
                className="common-layout"
                layout={layout}
                itemRender={itemRender}
                onDragEnter={onDragEnter}
                onDrop={onDrop}
            />
        </>
    );
}
