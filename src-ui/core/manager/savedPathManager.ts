import { ExportPathData, SavedPathData } from "@/shared/schema/savedPathSchema";

export class SavedPathManager {
    private exportPathMap: Map<string, string> = new Map<string, string>() // tilemapId -> exportPath
    private tilemapDir: string | null;
    private tilesetDir: string | null;
    private rulesetDir: string | null;
    private textureDir: string | null;

    constructor(savePathData: SavedPathData) {
        savePathData.exportPaths.forEach((data) => {
            if (data.exportPath) this.exportPathMap.set(data.tilemapId, data.exportPath);
        })
    }

    public getExportPath(tilemapId: string): string | null {
        return this.exportPathMap.get(tilemapId) || null;
    }

    public setExportPath(tilemapId: string, exportPath: string): void {
        this.exportPathMap.set(tilemapId, exportPath);
    }

    public getTilemapDir(): string | null {
        return this.tilemapDir;
    }

    public setTilemapDir(tilemapDir: string): void {
        this.tilemapDir = tilemapDir;
    }

    public getTilesetDir(): string | null {
        return this.tilesetDir;
    }

    public setTilesetDir(tilesetDir: string): void {
        this.tilesetDir = tilesetDir;
    }

    public getRulesetDir(): string | null {
        return this.rulesetDir;
    }

    public setRulesetDir(rulesetDir: string): void {
        this.rulesetDir = rulesetDir;
    }

    public getTextureDir(): string | null {
        return this.textureDir;
    }

    public setTextureDir(textureDir: string): void {
        this.textureDir = textureDir;
    }

    public serialize(): SavedPathData {
        const exportPathData: ExportPathData[] = [];
        this.exportPathMap.forEach((value, key) => exportPathData.push({ tilemapId: key, exportPath: value }));
        return {
            exportPaths: exportPathData,
            tilemapDir: this.tilemapDir,
            tilesetDir: this.tilesetDir,
            rulesetDir: this.rulesetDir,
            textureDir: this.textureDir,
        }
    }
}