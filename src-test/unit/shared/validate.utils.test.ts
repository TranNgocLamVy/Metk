import { describe, expect, it } from "vitest";

import { validate } from "@/shared/utils/validate.utils";

describe("validate", () => {
    it("validate.string returns valid strings", () => {
        expect(validate.string({ value: "abc", defaultValue: "default" })).toBe("abc");
    });

    it("validate.string returns defaults for invalid values", () => {
        const defaultValue = "default";

        expect(validate.string({ value: 1, defaultValue })).toBe(defaultValue);
        expect(validate.string({ value: {}, defaultValue })).toBe(defaultValue);
        expect(validate.string({ value: null, defaultValue })).toBe(defaultValue);
        expect(validate.string({ value: undefined, defaultValue })).toBe(defaultValue);
    });

    it("validate.requiredString throws for invalid values", () => {
        expect(() => validate.requiredString({ value: null, field: "name" })).toThrow("name");
    });

    it("validate.number returns valid finite numbers", () => {
        expect(validate.number({ value: 3.5, defaultValue: 0 })).toBe(3.5);
    });

    it("validate.number returns defaults for invalid numbers", () => {
        const defaultValue = 5;

        expect(validate.number({ value: Number.NaN, defaultValue })).toBe(defaultValue);
        expect(validate.number({ value: Infinity, defaultValue })).toBe(defaultValue);
        expect(validate.number({ value: -Infinity, defaultValue })).toBe(defaultValue);
        expect(validate.number({ value: "1", defaultValue })).toBe(defaultValue);
        expect(validate.number({ value: null, defaultValue })).toBe(defaultValue);
        expect(validate.number({ value: undefined, defaultValue })).toBe(defaultValue);
    });

    it("validate.number respects integer constraints", () => {
        expect(validate.number({ value: 4, defaultValue: 0, integer: true })).toBe(4);
        expect(validate.number({ value: 4.5, defaultValue: 0, integer: true })).toBe(0);
    });

    it("validate.number respects min and max constraints", () => {
        expect(validate.number({ value: 5, defaultValue: 0, min: 1, max: 10 })).toBe(5);
        expect(validate.number({ value: 0, defaultValue: 3, min: 1 })).toBe(3);
        expect(validate.number({ value: 11, defaultValue: 3, max: 10 })).toBe(3);
    });

    it("validate.requiredNumber throws for invalid values", () => {
        expect(() => validate.requiredNumber({ value: "1", field: "size" })).toThrow("size");
        expect(() => validate.requiredNumber({ value: 1.5, field: "size", integer: true })).toThrow("size");
        expect(() => validate.requiredNumber({ value: 0, field: "size", min: 1 })).toThrow("size");
        expect(() => validate.requiredNumber({ value: 11, field: "size", max: 10 })).toThrow("size");
    });

    it("validate.boolean returns valid booleans or defaults", () => {
        expect(validate.boolean({ value: true, defaultValue: false })).toBe(true);
        expect(validate.boolean({ value: false, defaultValue: true })).toBe(false);
        expect(validate.boolean({ value: "true", defaultValue: false })).toBe(false);
    });

    it("validate.array accepts arrays and defaults non-arrays", () => {
        expect(validate.array<number>({ value: [1, 2], defaultValue: [] })).toEqual([1, 2]);
        expect(validate.array<number>({ value: "not-array", defaultValue: [1] })).toEqual([1]);
    });

    it("validate.object accepts objects and defaults invalid values", () => {
        expect(validate.object({ value: { ok: true }, defaultValue: { ok: false } })).toEqual({ ok: true });
        expect(validate.object({ value: null, defaultValue: { ok: true } })).toEqual({ ok: true });
        expect(validate.object({ value: [], defaultValue: { ok: true } })).toEqual({ ok: true });
        expect(validate.object({ value: 1, defaultValue: { ok: true } })).toEqual({ ok: true });
    });

    it("validate.enum accepts valid enum values and defaults invalid values", () => {
        const values = ["a", "b"] as const;

        expect(validate.enum({ value: "a", values, defaultValue: "b" })).toBe("a");
        expect(validate.enum({ value: "c", values, defaultValue: "b" })).toBe("b");
    });

    it("validate.requiredEnum throws for invalid values", () => {
        const values = ["a", "b"] as const;

        expect(() => validate.requiredEnum({ value: "c", values, field: "mode" })).toThrow("mode");
    });
});
