import { ISerializer } from "@/infrastructure/interface/serializer.interface";
import { Result } from "@/shared/types/result";
import { JsonFormatter } from "@/shared/utils/jsonFormatter.utils";
import { jsonrepair } from "jsonrepair";

export class JsonSerializer<T> implements ISerializer<T> {
    serialize(data: T): Result<string> {
        try {
            const stringContent = JsonFormatter.format(data);
            if (!stringContent) return Result.Error("Serialization failed");
            return Result.Success(stringContent);
        } catch (error) {
            return Result.Error(`Serialization failed: ${String(error)}`);
        }
    }

    deserialize(rawString: string): Result<unknown> {
        try {
            const repairedString = jsonrepair(rawString);
            return Result.Success(JSON.parse(repairedString));
        } catch (error) {
            return Result.Error(`Invalid JSON: ${String(error)}`);
        }
    }
}
