import { createColumnLayoutAlgorithm, DndLayout, useLayout, verticalAxisConstraint } from "dnd-layout";
import "./common-layout.css";

export function Sample() {
    const layout = useLayout(() => {
        return {
            algorithm: createColumnLayoutAlgorithm({ columns: 1 }),
            initialItems: [
                { id: "1", column: 0, columnSpan: 1, height: 100 },
                { id: "2", column: 0, columnSpan: 1, height: 100 },
                { id: "3", column: 0, columnSpan: 1, height: 100 },
                { id: "4", column: 0, columnSpan: 1, height: 100 },
                { id: "5", column: 0, columnSpan: 1, height: 100 },
                { id: "6", column: 0, columnSpan: 1, height: 100 },
                { id: "7", column: 0, columnSpan: 1, height: 100 },
                { id: "8", column: 0, columnSpan: 1, height: 100 },
            ],
        };
    });
    return (
        <DndLayout
            className="common-layout"
            style={{
                width: 300,
            }}
            layout={layout}
            constraints={[verticalAxisConstraint()]}
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
