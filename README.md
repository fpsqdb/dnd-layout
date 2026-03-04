# Dnd-Layout
[![Build Status](https://img.shields.io/github/actions/workflow/status/fpsqdb/dnd-layout/test.yml?branch=main)](https://github.com/fpsqdb/dnd-layout/actions?query=workflow%3Atest)
[![npm Package](https://img.shields.io/npm/v/dnd-layout.svg)](https://www.npmjs.org/package/dnd-layout) 
![NPM dev or peer Dependency Version](https://img.shields.io/npm/dependency-version/dnd-layout/peer/react)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/fpsqdb/dnd-layout/blob/master/LICENSE) 
![node](https://img.shields.io/node/v/dnd-layout) 

Dnd-Layout is a drag-and-drop layout system that automatically adjusts its positioning based on changes in item size.
[Docs](https://dnd-layout.js.org) | [Demos](https://dnd-layout.js.org/demos/column-layout).

### Installation

```bash
npm install dnd-layout
```

### Quick Start

```tsx
import { createColumnLayoutAlgorithm, DndLayout, useLayout } from "dnd-layout";

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
            layout={layout}
            itemRender={(item) => {
                return (
                    <div
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
```

### API Reference

#### DndLayoutProps

| Property | Description | Type |
| :--- | :--- | :--- |
| <span style="color:red">*</span>layout | Layout store instance created by `useLayout`, used to update layout. | `ILayoutStore<T extends LayoutItem>` |
| <span style="color:red">*</span>itemRender | Renders a single item node. | `(item: T) => React.ReactNode` |
| className | Class name for the root container. | `string` |
| style | Style for the root container. | `React.CSSProperties` |
| layoutConfig | Layout render options (e.g. `gap`, fit container width/height to content). | `LayoutConfig` |
| dragConfig | Drag behavior config. Set `enable=false` to disable dragging; use `draggableSelector` as a drag handle filter. | `DragConfig` |
| constraints | Drag constraints applied during movement to clamp/adjust positions. | `Constraint[]` |
| placeholderRender | Custom placeholder renderer shown while dragging or external dropping. | `(item: T) => React.ReactNode` |
| onLayoutChange | Called after layout changes. | `(items: T[]) => void` |
| onDragEnter | Called when external drag enters the container. Return a `T` to accept/insert a temporary item, or `false` to reject. | `(event: React.DragEvent, id: string) => T \| false` |
| onDrop | Called when external drop happens. Return final `T` to confirm, or `false` to cancel and remove the temporary item. | `(event: React.DragEvent, item: T) => T \| false` |