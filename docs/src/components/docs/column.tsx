import { createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "../demos/common-layout.css";

export function ColumnSample() {
    const layout = useLayout(() => {
        return {
            algorithm: createColumnLayoutAlgorithm({ columns: 6 }),
            initialItems: [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 2, columnSpan: 1, height: 100 },
                { id: "4", column: 3, columnSpan: 1, height: 100 },
                { id: "5", column: 4, columnSpan: 1, height: 100 },
                { id: "6", column: 5, columnSpan: 1, height: 100 },
                { id: "7", column: 0, columnSpan: 1, height: 100 },
                { id: "8", column: 1, columnSpan: 1, height: 100 },
                { id: "9", column: 2, columnSpan: 1, height: 100 },
                { id: "10", column: 3, columnSpan: 1, height: 100 },
                { id: "11", column: 4, columnSpan: 1, height: 100 },
                { id: "12", column: 5, columnSpan: 1, height: 100 },
                { id: "13", column: 0, columnSpan: 1, height: 100 },
            ],
        };
    });
    return (
        <DndLayout
            className="common-layout"
            layout={layout}
            layoutConfig={{
                containerFitContentHeight: true,
            }}
            itemRender={(item) => {
                return (
                    <div
                        className="common-layout-item"
                        style={{
                            height: 100,
                        }}
                    >
                        {item.id}
                    </div>
                );
            }}
        />
    );
}
