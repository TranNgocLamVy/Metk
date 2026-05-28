import { appKernel } from "@/application/bootstrap/app-kernel";
import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { BaseProperty } from "@/editor/properties/properties";
import { Result } from "@/shared/types/result";

type PropertyTarget = {
    objectId?: string;
};

export function executeUpdatePropertyCommand<TValue>(
    property: BaseProperty<any>,
    oldValue: TValue,
    newValue: TValue,
): Result {
    if (arePropertyValuesEqual(oldValue, newValue)) {
        return Result.Cancel("Property value unchanged");
    }

    const objectId = (property.target as PropertyTarget).objectId;

    if (!objectId) {
        return Result.Error(`Cannot update property "${property.key}" because target objectId is missing.`);
    }

    const command = new UpdatePropertyCommand(
        objectId,
        property.key,
        clonePropertyValue(oldValue),
        clonePropertyValue(newValue),
    );

    const historyManager = appKernel.editorFacade.getCurrentHistoryManager();

    if (!historyManager) {
        return command.execute(appKernel.editorFacade);
    }

    return historyManager.execute(command, appKernel.editorFacade);
}

export function clonePropertyValue<T>(value: T): T {
    if (value === null || typeof value !== "object") return value;

    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
}

export function arePropertyValuesEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;

    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}