import { type ColumnLayoutItem, createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "./common-layout.css";

const initialItems: ColumnLayoutItem[] = [
    { id: "1", column: 0, columnSpan: 1, height: 140 },
    { id: "2", column: 1, columnSpan: 1, height: 140 },
    { id: "3", column: 2, columnSpan: 1, height: 140 },
    { id: "4", column: 0, columnSpan: 1, height: 140 },
    { id: "5", column: 1, columnSpan: 1, height: 140 },
    { id: "6", column: 2, columnSpan: 1, height: 140 },
    { id: "7", column: 0, columnSpan: 1, height: 140 },
    { id: "8", column: 1, columnSpan: 1, height: 140 },
    { id: "9", column: 2, columnSpan: 1, height: 140 },
    { id: "10", column: 0, columnSpan: 1, height: 140 },
];

export function Sample() {
    const layout = useLayout(() => {
        let items: ColumnLayoutItem[] = [];
        try {
            const content = localStorage.getItem("column-layout-items");
            if (content) {
                items = JSON.parse(content);
            }
        } catch (error) {
            console.error(error);
        }
        if (items.length === 0) {
            items = initialItems;
        }
        return {
            algorithm: createColumnLayoutAlgorithm(),
            initialItems: items,
        };
    });

    const onReset = () => {
        layout.setItems(initialItems);
    };

    const onLayoutChange = (items: ColumnLayoutItem[]) => {
        localStorage.setItem("column-layout-items", JSON.stringify(items));
    };

    return (
        <>
            <button className="dnd-button" type="button" style={{ marginBottom: 12 }} onClick={onReset}>
                Reset
            </button>
            <DndLayout
                className="common-layout"
                layout={layout}
                itemRender={(item) => {
                    return (
                        <div
                            className="common-layout-item"
                            style={{
                                height: 140,
                            }}
                        >
                            {item.id}
                        </div>
                    );
                }}
                onLayoutChange={onLayoutChange}
            />
        </>
    );
}
