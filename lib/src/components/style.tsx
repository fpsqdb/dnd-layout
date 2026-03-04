export function DndStyle() {
    return (
        <style>{`
            @layer base {
                .dnd-layout {
                    position: relative;
                    box-sizing: border-box;
                }
                .dnd-layout .dnd-layout-placeholder {
                    box-sizing: border-box;
                    pointer-events: none;
                    transition: translate 200ms;
                }
                .dnd-layout .dnd-layout-placeholder .dnd-layout-placeholder-default-content {
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                    border: 2px dashed #1890ff;
                    background-color: rgba(24, 144, 255, 0.3);
                }
                .dnd-layout .dnd-layout-item {
                    box-sizing: border-box;
                    touch-action: none;
                }
                .dnd-layout.dnd-layout-column .dnd-layout-placeholder,
                .dnd-layout.dnd-layout-column .dnd-layout-item {
                    display: flex;
                    flex-direction: column;
                }
                .dnd-layout.dnd-layout-column .dnd-layout-placeholder .dnd-layout-placeholder-default-content,
                .dnd-layout.dnd-layout-column .dnd-layout-item .dnd-layout-item-content {
                    display: flex;
                    flex-direction: column;
                }
                .dnd-layout.dnd-layout-row .dnd-layout-placeholder,
                .dnd-layout.dnd-layout-row .dnd-layout-item {
                    display: flex;
                }
                .dnd-layout.dnd-layout-row .dnd-layout-placeholder .dnd-layout-placeholder-default-content,
                .dnd-layout.dnd-layout-row .dnd-layout-item .dnd-layout-item-content {
                    display: flex;
                }
                .dnd-layout .dnd-layout-item:not(.dnd-layout-item-dragging) {
                    transition: translate 200ms;
                }
            }
        `}</style>
    );
}
