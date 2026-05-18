import { Console } from "@/shared/services/console.service";
import { Result } from "@/shared/types/result";

export function CatchError(defaultErrorMsg: any = "message.system.unknownError.default") {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            try {
                const result = originalMethod.apply(this, args);
                if (result && typeof result.then === "function" && typeof result.catch === "function") {
                    return result.catch((error: any) => {
                        console.error(`[${target?.constructor?.name || 'Class'}.${propertyKey}] Async Error:`, error);
                        Console.error({ message: defaultErrorMsg, stacks: [String(error)] });
                        return Result.Error(defaultErrorMsg);
                    });
                }
                return result;
            } catch (error) {
                console.error(`${target?.constructor?.name || 'Class'}.${propertyKey}] Sync Error:`, error);
                return Result.Error(defaultErrorMsg);
            }
        };
        return descriptor;
    };
}