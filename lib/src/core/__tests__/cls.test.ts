import { describe, expect, it } from "vitest";
import { cls } from "../cls";

describe("cls", () => {
    it("should combine string arguments", () => {
        expect(cls("class1", "class2")).toBe("class1 class2");
    });

    it("should filter out falsy string arguments", () => {
        expect(cls("class1", "", "class2", null, undefined)).toBe("class1 class2");
    });

    it("should handle object arguments with boolean values", () => {
        expect(cls("class1", { class2: true, class3: false }, "class4")).toBe("class1 class2 class4");
    });

    it("should handle mixed arguments", () => {
        expect(cls("class1", { active: true }, "class3", { hidden: false }, "class5")).toBe(
            "class1 active class3 class5",
        );
    });

    it("should return an empty string if no valid classes are provided", () => {
        expect(cls("", null, undefined, { a: false, b: false })).toBe("");
    });

    it("should handle invalid type arguments", () => {
        expect(cls(1 as unknown as string)).toBe("");
        expect(cls(NaN as unknown as string)).toBe("");
    });

    it("should handle empty arguments", () => {
        expect(cls()).toBe("");
    });
});
