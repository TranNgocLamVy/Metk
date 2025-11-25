import { Result } from "@/core/constance/common/result";

export interface ITilelayer {
    getName(): string;
    rename(name: string): Promise<Result>;
}