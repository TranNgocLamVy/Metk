import { type } from "arktype";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
import { ISerializer } from "@/infrastructure/interface/ISerializer";
import { Result } from "../../shared/types/result";

export class ArkTypeJsonSerializer<T> implements ISerializer<T> {
    // Nhận vào một arktype schema
    constructor(private schema?: any) {}

    serialize(data: T): Result<string> {
        try {
            const stringContent = JsonFormatter.format(data);
            if (!stringContent) throw new Error("Format failed");
            return Result.Success(stringContent);
        } catch (error) {
            return Result.Error("Serialization failed");
        }
    }

    deserialize(rawString: string): Result<T> {
        // Parse JSON sau đó validate bằng schema
        if (!this.schema) {
            const parsed = JSON.parse(rawString);
            return Result.Success(parsed)
        }

        const validatedData = this.schema(rawString);
        
        if (validatedData instanceof type.errors) {
            console.error(validatedData.summary);
            return Result.Error("Data validation failed: " + validatedData.summary);
        }
        
        return Result.Success(validatedData);
    }
}