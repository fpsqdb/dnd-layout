import { describe, expect, it } from "vitest";
import {
    DEFAULT_LAYOUT_CONFIG,
    DEFAULT_LAYOUT_GAP,
    DEFAULT_LAYOUT_RENDER_CONFIG,
    DRAGGING_ITEM_TRANSLATE_CSS_VAR,
} from "../constants";

describe("constants", () => {
    describe("DRAGGING_ITEM_TRANSLATE_CSS_VAR", () => {
        it("should be a valid CSS variable name", () => {
            expect(DRAGGING_ITEM_TRANSLATE_CSS_VAR).toBe("--dnd-layout-dragging-item-translate");
            expect(DRAGGING_ITEM_TRANSLATE_CSS_VAR.startsWith("--")).toBe(true);
        });
    });

    describe("DEFAULT_LAYOUT_GAP", () => {
        it("should be a tuple of two numbers", () => {
            expect(DEFAULT_LAYOUT_GAP).toHaveLength(2);
            expect(typeof DEFAULT_LAYOUT_GAP[0]).toBe("number");
            expect(typeof DEFAULT_LAYOUT_GAP[1]).toBe("number");
        });

        it("should have default values of [12, 12]", () => {
            expect(DEFAULT_LAYOUT_GAP).toEqual([12, 12]);
        });
    });

    describe("DEFAULT_LAYOUT_CONFIG", () => {
        it("should have gap property", () => {
            expect(DEFAULT_LAYOUT_CONFIG.gap).toEqual(DEFAULT_LAYOUT_GAP);
        });
    });

    describe("DEFAULT_LAYOUT_RENDER_CONFIG", () => {
        it("should have layoutSize with zero dimensions", () => {
            expect(DEFAULT_LAYOUT_RENDER_CONFIG.layoutSize).toEqual({
                layoutWidth: 0,
                layoutHeight: 0,
            });
        });

        it("should have gap property", () => {
            expect(DEFAULT_LAYOUT_RENDER_CONFIG.gap).toEqual(DEFAULT_LAYOUT_GAP);
        });
    });
});
