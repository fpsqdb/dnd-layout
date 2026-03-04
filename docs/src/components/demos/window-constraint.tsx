import { createColumnLayoutAlgorithm, DndLayout, useLayout, windowConstraint } from "dnd-layout";
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
                { id: "7", column: 0, columnSpan: 1, height: 140 },
                { id: "8", column: 1, columnSpan: 1, height: 140 },
                { id: "9", column: 2, columnSpan: 1, height: 140 },
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
            constraints={[windowConstraint()]}
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
        />
    );
}
