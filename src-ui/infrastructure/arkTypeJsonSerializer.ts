import { type } from "arktype";
import { JsonFormatter } from "@/shared/utils/jsonFormatter";
import { ISerializer } from "@/infrastructure/interface/ISerializer";
import { Result } from "../shared/types/result";

export class ArkTypeJsonSerializer<T> implements ISerializer<T> {
    // Nhận vào một arktype schema
    constructor(private schema?: any) {}

    serialize(data: T): Result<string> {
        try {
            const stringContent = JsonFormatter.format(data);
            if (!stringContent) throw new Error("Format failed");
            return { status: "Success", data: stringContent };
        } catch (error) {
            return { status: "Error", message: "Serialization failed" };
        }
    }

    deserialize(rawString: string): Result<T> {
        // Parse JSON sau đó validate bằng schema
        const parsed = JSON.parse(rawString);

            if (!this.schema) return Result.Success(parsed);

        const validatedData = this.schema(parsed);
        
        if (validatedData instanceof type.errors) {
            console.error(validatedData.summary);
            return { status: "Error", message: "Data validation failed: " + validatedData.summary };
        }
        
        return { status: "Success", data: validatedData as T };
    }
}