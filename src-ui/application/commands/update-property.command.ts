import { v4 as uuidv4 } from "uuid";

import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import type { PropertyUpdateMeta } from "@/editor/model/base-object";
import { Result } from "@/shared/types/result";

export class UpdatePropertyCommand<TValue = unknown> implements IUndoableCommand {
    public readonly id: string = uuidv4();

    constructor(
        public readonly objectId: string,
        public readonly propertyKey: string,
        public readonly oldValue: TValue,
        public readonly newValue: TValue,
    ) {}

    public execute(context: IUndoableCommandContext): Result {
        return this.applyValue(context, this.newValue, {
            origin: "commit",
            source: "UpdatePropertyCommand",
        });
    }

    public undo(context: IUndoableCommandContext): Result {
        return this.applyValue(context, this.oldValue, {
            origin: "undo",
            source: "UpdatePropertyCommand",
        });
    }

    public redo(context: IUndoableCommandContext): Result {
        return this.applyValue(context, this.newValue, {
            origin: "redo",
            source: "UpdatePropertyCommand",
        });
    }

    public delete(): void {
        // no resource cleanup needed
    }

    private applyValue(context: IUndoableCommandContext, value: TValue, meta: PropertyUpdateMeta): Result {
        const object = context.objectRegistry.get(this.objectId);

        if (!object) {
            return Result.Error(`Object not found: ${this.objectId}`);
        }

        const property = object.properties.get(this.propertyKey);

        if (!property) {
            return Result.Error(`Property not found: ${this.propertyKey}`);
        }

        const clonedValue = cloneCommandValue(value);
        const validateResult = property.validate(clonedValue);

        if (validateResult.status !== Result.Status.Success) {
            return validateResult;
        }

        property.setter(clonedValue, meta);
        return Result.Success();
    }
}

function cloneCommandValue<T>(value: T): T {
    if (value === null || typeof value !== "object") return value;

    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
}
