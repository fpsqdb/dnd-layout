import { createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "../demos/common-layout.css";

export function GettingStartSample() {
    const layout = useLayout(() => {
        return {
            algorithm: createColumnLayoutAlgorithm(),
            initialItems: [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 1, columnSpan: 1, height: 100 },
                { id: "3", column: 2, columnSpan: 1, height: 100 },
                { id: "4", column: 0, columnSpan: 1, height: 100 },
                { id: "5", column: 1, columnSpan: 1, height: 100 },
                { id: "6", column: 2, columnSpan: 1, height: 100 },
            ],
        };
    });
    return (
        <DndLayout
            className="common-layout"
            layout={layout}
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
