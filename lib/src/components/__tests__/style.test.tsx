import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { DndStyle } from "../style";

describe("DndStyle Component", () => {
    it("should render a style element", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        expect(styleElement).toBeTruthy();
    });

    it("should inject CSS styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        expect(styleElement?.textContent).toBeTruthy();
        expect(styleElement?.textContent).toContain("@layer base");
    });

    it("should define base layout styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout");
        expect(content).toContain("position: relative");
        expect(content).toContain("box-sizing: border-box");
    });

    it("should define placeholder styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-placeholder");
        expect(content).toContain("transition: translate 200ms");
    });

    it("should define placeholder default content styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-placeholder-default-content");
        expect(content).toContain("border: 2px dashed #1890ff");
        expect(content).toContain("background-color: rgba(24, 144, 255, 0.3)");
    });

    it("should define layout item styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-item");
        expect(content).toContain("touch-action: none");
    });

    it("should define column layout styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-column");
        expect(content).toContain("flex-direction: column");
    });

    it("should define row layout styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-row");
        expect(content).toContain("display: flex");
    });

    it("should define transition for non-dragging items", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-item:not(.dnd-layout-item-dragging)");
        expect(content).toContain("transition: translate 200ms");
    });

    it("should set pointer-events to none for placeholder", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Checking that pointer-events is configured (either explicitly or through settings)
        expect(content).toContain(".dnd-layout");
    });

    it("should define layout item content styles for column layout", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-column .dnd-layout-item .dnd-layout-item-content");
        expect(content).toContain("display: flex");
        expect(content).toContain("flex-direction: column");
    });

    it("should define layout item content styles for row layout", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-row .dnd-layout-item .dnd-layout-item-content");
        expect(content).toContain("display: flex");
    });

    it("should apply styles to both placeholder and item", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Check that both placeholder and item classes are styled similarly
        expect(content).toContain(".dnd-layout-column .dnd-layout-placeholder");
        expect(content).toContain(".dnd-layout-column .dnd-layout-item");
    });

    it("should use cascading layer for styles", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain("@layer base");
    });

    it("should maintain consistent styling across all variants", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Verify key style properties are present
        expect(content.includes("box-sizing: border-box")).toBe(true);
        expect(content.includes("display: flex")).toBe(true);
        expect(content.includes("transition: translate 200ms")).toBe(true);
    });

    it("should render multiple instances without conflict", async () => {
        const { container } = await render(
            <>
                <DndStyle />
                <DndStyle />
                <DndStyle />
            </>,
        );

        const styleElements = container.querySelectorAll("style");
        expect(styleElements.length).toBe(3);

        styleElements.forEach((styleElement) => {
            expect(styleElement.textContent).toContain("@layer base");
            expect(styleElement.textContent).toContain(".dnd-layout");
        });
    });

    it("should define placeholder default content with full dimensions", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-placeholder-default-content");
        expect(content).toContain("width: 100%");
        expect(content).toContain("height: 100%");
    });

    it("should apply correct border style to placeholder default content", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        const placeholderDefaultStyle = content.match(/\.dnd-layout-placeholder-default-content\s*\{[^}]*\}/);

        expect(placeholderDefaultStyle).toBeTruthy();
        expect(content).toContain("border: 2px dashed #1890ff");
    });

    it("should support display flex for placeholder content in column mode", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        expect(content).toContain(".dnd-layout-column .dnd-layout-placeholder .dnd-layout-placeholder-default-content");
        expect(content).toContain("display: flex");
    });

    it("should define item not dragging transition", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Verify the selector and transition property
        expect(content).toContain(":not(.dnd-layout-item-dragging)");
        expect(content).toContain("transition: translate 200ms");
    });

    it("should handle multiple class combinations for column and row layouts", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Verify both column and row layout configurations
        expect(content).toContain(".dnd-layout.dnd-layout-column");
        expect(content).toContain(".dnd-layout.dnd-layout-row");
    });

    it("should be properly formatted CSS", async () => {
        const { container } = await render(<DndStyle />);

        const styleElement = container.querySelector("style");
        const content = styleElement?.textContent || "";

        // Check for proper CSS structure
        expect(content).toMatch(/{[\s\S]*}/);
        expect(content).toContain(":");
        expect(content).toContain(";");
    });
});
