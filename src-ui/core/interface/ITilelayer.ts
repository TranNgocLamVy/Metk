import { Result } from "@/shared/types/result";

export interface ITilelayer {
    getName(): string;
    rename(name: string): Promise<Result>;
}