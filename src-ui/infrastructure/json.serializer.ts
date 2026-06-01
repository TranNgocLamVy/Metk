import { ISerializer } from "@/infrastructure/interface/serializer.interface";
import { Result } from "@/shared/types/result";
import { Formatter } from "fracturedjsonjs";
import { jsonrepair } from "jsonrepair";

const formatter = new Formatter();
formatter.Options.MaxTotalLineLength = 8000; 
formatter.Options.MaxInlineComplexity = 2;
formatter.Options.MinCompactArrayRowItems = 4;

export class JsonSerializer<T> implements ISerializer<T> {
    serialize(data: T): Result<string> {
        try {
            const stringContent = this.format(data);
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

    private format(object: any): string | null {
        const result = formatter.Serialize(object);
        if (!result) return null;
        return result;
    }
}
