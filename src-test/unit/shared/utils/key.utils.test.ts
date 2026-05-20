import { describe, expect, it } from "vitest";

import { KeyUtils } from "@/shared/utils/key.utils";

const keyboardEvent = (key: string, init: Partial<KeyboardEvent> = {}) => (
    new KeyboardEvent("keydown", {
        key,
        ctrlKey: init.ctrlKey,
        shiftKey: init.shiftKey,
        altKey: init.altKey,
        metaKey: init.metaKey,
    })
);

describe("KeyUtils", () => {
    it("formats modifier key combinations in a stable order", () => {
        expect(KeyUtils.getKeystrokeString(keyboardEvent("s", { ctrlKey: true, shiftKey: true }))).toBe("Ctrl+Shift+S");
        expect(KeyUtils.getKeystrokeString(keyboardEvent("`", { ctrlKey: true }))).toBe("Ctrl+`");
        expect(KeyUtils.getKeystrokeString(keyboardEvent("z", { metaKey: true, altKey: true }))).toBe("Alt+Cmd+Z");
    });

    it("omits standalone modifier key names", () => {
        expect(KeyUtils.getKeystrokeString(keyboardEvent("Control", { ctrlKey: true }))).toBe("Ctrl");
        expect(KeyUtils.getKeystrokeString(keyboardEvent("Shift", { shiftKey: true }))).toBe("Shift");
        expect(KeyUtils.getKeystrokeString(keyboardEvent("Meta", { metaKey: true }))).toBe("Cmd");
    });
});
