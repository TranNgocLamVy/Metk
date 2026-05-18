import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { ExportPathData, SavedPathData } from "@/shared/schema/saved-path.schema";

export class WorkspaceSavedPathManager {
    private exportPathMap: Map<string, string> = new Map<string, string>() // tilemapId -> exportPath
    private tilemapDir: string | null;
    private tilesetDir: string | null;
    private rulesetDir: string | null;
    private textureDir: string | null;

    constructor(savePathData: SavedPathData, private readonly projectPathSystem: ProjectPathSystem) {
        savePathData.exportPaths.forEach((data) => {
            if (data.exportPath) this.exportPathMap.set(data.tilemapId, data.exportPath);
        })
        this.tilemapDir = savePathData.tilemapDir;
        this.tilesetDir = savePathData.tilesetDir;
        this.rulesetDir = savePathData.rulesetDir;
        this.textureDir = savePathData.textureDir;
    }

    public getExportPath(tilemapId: string): string | null {
        return this.exportPathMap.get(tilemapId) || null;
    }

    public setExportPath(tilemapId: string, exportPath: string): void {
        this.exportPathMap.set(tilemapId, exportPath);
    }

    public getTilemapDir(): string {
        return this.tilemapDir || this.projectPathSystem.absDir;
    }

    public setTilemapDir(tilemapDir: string): void {
        this.tilemapDir = tilemapDir;
    }

    public getTilesetDir(): string {
        return this.tilesetDir || this.projectPathSystem.absDir;
    }

    public setTilesetDir(tilesetDir: string): void {
        this.tilesetDir = tilesetDir;
    }

    public getRulesetDir(): string {
        return this.rulesetDir || this.projectPathSystem.absDir;
    }

    public setRulesetDir(rulesetDir: string): void {
        this.rulesetDir = rulesetDir;
    }

    public getTextureDir(): string {
        return this.textureDir || this.projectPathSystem.absDir;
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