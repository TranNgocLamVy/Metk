import { Result } from "@/shared/types/result";

export interface ISerializer<T> {
    serialize(data: T): Result<string>;
    deserialize(rawString: string): Result<T>;
}