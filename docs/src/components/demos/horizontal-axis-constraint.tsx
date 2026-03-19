import { createRowLayoutAlgorithm, DndLayout, horizontalAxisConstraint, useLayout } from "dnd-layout";
import "./common-layout.css";

export function Sample() {
    const layout = useLayout(() => {
        return {
            algorithm: createRowLayoutAlgorithm({ rows: 1 }),
            initialItems: [
                { id: "1", row: 0, rowSpan: 1, width: 100 },
                { id: "2", row: 1, rowSpan: 1, width: 100 },
                { id: "3", row: 2, rowSpan: 1, width: 100 },
                { id: "4", row: 0, rowSpan: 1, width: 100 },
                { id: "5", row: 1, rowSpan: 1, width: 100 },
                { id: "6", row: 2, rowSpan: 1, width: 100 },
                { id: "7", row: 0, rowSpan: 1, width: 100 },
                { id: "8", row: 1, rowSpan: 1, width: 100 },
            ],
        };
    });
    return (
        <DndLayout
            className="common-layout"
            style={{
                height: 100,
            }}
            layout={layout}
            constraints={[horizontalAxisConstraint()]}
            itemRender={(item) => {
                return (
                    <div
                        className="common-layout-item"
                        style={{
                            width: 100,
                        }}
                    >
                        {item.id}
                    </div>
                );
            }}
        />
    );
}
