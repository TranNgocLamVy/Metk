import { describe, expect, it, vi } from "vitest";

import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { BaseObject, PropertyUpdateMeta } from "@/editor/model/base-object";
import { StringProperty } from "@/editor/properties/properties.decorator";
import { Result } from "@/shared/types/result";

class TestObject extends BaseObject {
    @StringProperty<TestObject>({
        label: "Name",
        get: target => target.name,
        set: (target, value, meta) => {
            target.setName(value, meta);
        },
    })
    public name = "Initial";

    public setName(value: string, meta?: PropertyUpdateMeta): void {
        this.name = value;
        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "TestObject.setName",
        });
    }
}

function createHarness() {
    const object = new TestObject("object:test");
    const editorFacade = {
        objectRegistry: {
            get: vi.fn((objectId: string) => objectId === object.objectId ? object : undefined),
        },
    } as any;
    const listener = vi.fn();
    object.eventEmitter.on("updateProperty", listener);

    return { object, editorFacade, listener };
}

describe("UpdatePropertyCommand", () => {
    it("emits commit metadata when executed", () => {
        const { object, editorFacade, listener } = createHarness();
        const command = new UpdatePropertyCommand(object.objectId, "name", "Initial", "Committed");

        expect(command.execute(editorFacade)).toEqual(Result.Success());

        expect(object.name).toBe("Committed");
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith("name", "Committed", {
            origin: "commit",
            source: "UpdatePropertyCommand",
        });
    });

    it("emits undo metadata when undone", () => {
        const { object, editorFacade, listener } = createHarness();
        const command = new UpdatePropertyCommand(object.objectId, "name", "Initial", "Committed");

        command.execute(editorFacade);
        listener.mockClear();

        expect(command.undo(editorFacade)).toEqual(Result.Success());

        expect(object.name).toBe("Initial");
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith("name", "Initial", {
            origin: "undo",
            source: "UpdatePropertyCommand",
        });
    });

    it("emits redo metadata when redone", () => {
        const { object, editorFacade, listener } = createHarness();
        const command = new UpdatePropertyCommand(object.objectId, "name", "Initial", "Committed");

        command.execute(editorFacade);
        command.undo(editorFacade);
        listener.mockClear();

        expect(command.redo(editorFacade)).toEqual(Result.Success());

        expect(object.name).toBe("Committed");
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith("name", "Committed", {
            origin: "redo",
            source: "UpdatePropertyCommand",
        });
    });
});
