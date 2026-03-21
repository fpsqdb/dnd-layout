import CloseIcon from "@site/static/img/close.svg";
import { type ColumnLayoutItem, createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "./common-layout.css";
import { useRef } from "react";

export function Sample() {
    const itemsRef = useRef<ColumnLayoutItem[]>([]);
    const idRef = useRef(0);
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
        const onRemove = () => {
            layout.setItems(itemsRef.current.filter((i) => i.id !== item.id));
        };
        return (
            <div
                className="common-layout-item"
                style={{
                    height: 140,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    {item.id}
                    <CloseIcon
                        style={{
                            height: 16,
                            width: 16,
                            cursor: "pointer",
                        }}
                        title="remove"
                        onClick={onRemove}
                    />
                </div>
            </div>
        );
    };

    const onLayoutChange = (items: ColumnLayoutItem[]) => {
        itemsRef.current = items;
    };

    const onAdd= (columnSpan: number) => {
        idRef.current++;
        layout.setItems([...itemsRef.current, { id: `new-${idRef.current}`, column: -1, columnSpan, height: 140 }]);
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 12,
                }}
            >
                <button className="dnd-button" type="button" onClick={() => onAdd(1)}>
                    Add (columnSpan: 1)
                </button>
                <button className="dnd-button" type="button" onClick={() => onAdd(2)}>
                    Add (columnSpan: 2)
                </button>
                <button className="dnd-button" type="button" onClick={() => onAdd(3)}>
                    Add (columnSpan: 3)
                </button>
            </div>
            <DndLayout
                className="common-layout"
                layout={layout}
                itemRender={itemRender}
                onLayoutChange={onLayoutChange}
            />
        </>
    );
}
