import { createRowLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";
import "./common-layout.css";

export function Sample() {
    const layout = useLayout(() => {
        return {
            algorithm: createRowLayoutAlgorithm(),
            initialItems: [
                { id: "1", row: 0, rowSpan: 1, width: 200 },
                { id: "2", row: 1, rowSpan: 1, width: 200 },
                { id: "3", row: 2, rowSpan: 1, width: 200 },
                { id: "4", row: 0, rowSpan: 1, width: 200 },
                { id: "5", row: 1, rowSpan: 1, width: 200 },
                { id: "6", row: 2, rowSpan: 1, width: 200 },
                { id: "7", row: 0, rowSpan: 1, width: 200 },
                { id: "8", row: 1, rowSpan: 1, width: 200 },
                { id: "9", row: 2, rowSpan: 1, width: 200 },
                { id: "10", row: 1, rowSpan: 2, width: 200 },
            ],
        };
    });
    return (
        <div
            style={{
                height: 500,
                paddingBlock: 24,
                overflow: "auto",
            }}
        >
            <DndLayout
                className="common-layout"
                style={{
                    height: "100%",
                }}
                layout={layout}
                itemRender={(item) => {
                    return (
                        <div
                            className="common-layout-item"
                            style={{
                                width: 200,
                            }}
                        >
                            {item.id}
                        </div>
                    );
                }}
            />
        </div>
    );
}
