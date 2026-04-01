import { ExportPathData } from "@/shared/schema/workspaceSchema";

export class ExportPathManager {
    private exportPathMap: Map<string, string> = new Map<string, string>() // tilemapId -> exportPath

    constructor(exportPathData: ExportPathData[]) {
        exportPathData.forEach((data) => {
            if (data.exportPath) this.exportPathMap.set(data.tilemapId, data.exportPath);
        })
    }

    public getExportPath(tilemapId: string): string | undefined {
        return this.exportPathMap.get(tilemapId);
    }

    public setExportPath(tilemapId: string, exportPath: string): void {
        this.exportPathMap.set(tilemapId, exportPath);
    }

    public serialize(): ExportPathData[] {
        const exportPathData: ExportPathData[] = [];
        this.exportPathMap.forEach((value, key) => exportPathData.push({ tilemapId: key, exportPath: value }));
        return exportPathData;
    }
}