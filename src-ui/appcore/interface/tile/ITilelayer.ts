import { Result } from "@/appcore/interface/common/result";

export interface ITilelayer {
    getName(): string;
    rename(name: string): Promise<Result>;
}