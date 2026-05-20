import { describe, expect, it } from "vitest";

import { ActivationContext } from "@/application/runtime/activation-context";

describe("ActivationContext", () => {
    it("evaluates missing conditions as active", () => {
        expect(new ActivationContext().evaluateWhen()).toBe(true);
        expect(new ActivationContext().evaluateWhen("")).toBe(true);
    });

    it("evaluates positive and negated flags", () => {
        const context = new ActivationContext();

        expect(context.evaluateWhen("projectOpened")).toBeFalsy();
        expect(context.evaluateWhen("!projectOpened")).toBe(true);

        context.setFlag("projectOpened", true, "project-a");

        expect(context.evaluateWhen("projectOpened")).toBe(true);
        expect(context.evaluateWhen("!projectOpened")).toBe(false);
    });

    it("keeps a flag active while any instigator remains active", () => {
        const context = new ActivationContext();

        context.setFlag("isModalOpen", true, "dialog-a");
        context.setFlag("isModalOpen", true, "dialog-b");
        context.setFlag("isModalOpen", false, "dialog-a");

        expect(context.evaluateWhen("isModalOpen")).toBe(true);

        context.setFlag("isModalOpen", false, "dialog-b");

        expect(context.evaluateWhen("isModalOpen")).toBeFalsy();
    });

    it("supports quoted equality and inequality value checks", () => {
        const context = new ActivationContext();
        context.setValue("tool", "stamp");
        context.setValue("zoom", 2);
        context.setValue("enabled", true);

        expect(context.evaluateWhen('tool == "stamp"')).toBe(true);
        expect(context.evaluateWhen("tool != eraser")).toBe(true);
        expect(context.evaluateWhen("zoom == 2")).toBe(false);
        expect(context.evaluateWhen("enabled != false")).toBe(true);
    });

    it("supports AND, OR, and mixed expressions", () => {
        const context = new ActivationContext();
        context.setFlag("projectOpened", true, "project");
        context.setFlag("tilemapSessionOpened", true, "session");
        context.setValue("tool", "stamp");

        expect(context.evaluateWhen("projectOpened && tilemapSessionOpened")).toBe(true);
        expect(context.evaluateWhen("projectOpened && missingFlag")).toBeFalsy();
        expect(context.evaluateWhen("missingFlag || tilemapSessionOpened")).toBe(true);
        expect(context.evaluateWhen('missingFlag || projectOpened && tool == "stamp"')).toBe(true);
        expect(context.evaluateWhen('projectOpened && tool == "eraser" || tilemapSessionOpened')).toBe(true);
    });

    it("updates evaluation after flags are deactivated", () => {
        const context = new ActivationContext();
        context.setFlag("projectOpened", true, "project");

        expect(context.evaluateWhen("projectOpened")).toBe(true);

        context.setFlag("projectOpened", false, "project");

        expect(context.evaluateWhen("projectOpened")).toBeFalsy();
        expect(context.evaluateWhen("!projectOpened")).toBe(true);
    });
});
