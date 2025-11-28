import { Result } from "@/shared/types/result";

export interface ITilemap {
    getName(): string;
    rename(name: string): Promise<Result>;
    addTilelayer(): Promise<Result>;
    removeTilelayer(id: string): Promise<Result>;
    reorderTilelayer(id: string, newIndex: number): Promise<Result>;
}