import { v4 as uuidv4 } from "uuid";

import { EditorFacade } from "@/application/editor.facade";
import { IBaseCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SetTilesData, TileLayer } from "@/editor/model/tilemap/layer/tile-layer";

export class SetTilesCommand implements IBaseCommand {
    public readonly id: string = uuidv4()

    private data: SetTilesData[] = [];
    private oldData: SetTilesData[] = [];

    constructor(
        private readonly layerId: string,
        data: SetTilesData[],
    ) {
        this.data = [...data];
    }

    public execute(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId);
        if (!layer) return Result.Error("Layer not found");
        if (!(layer instanceof TileLayer)) return Result.Error("Layer is not a tile layer");

        const result = layer.setTilesAt(this.data);

        if (result.status === Result.Status.Success) {
            currentSession.markAsDirty();
            this.oldData = result.data;
        }

        return result
    }

    public undo(editorFacade: EditorFacade): Result {
        if (this.oldData.length === 0) return Result.Cancel("No tile changed");

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return Result.Error("Tilemap not found");

        const tilemap = currentSession.tilemap;

        const layer = tilemap.rootLayer.findLayer(this.layerId);
        if (!layer) return Result.Error("Layer not found");
        if (!(layer instanceof TileLayer)) return Result.Error("Layer is not a tile layer");

        if (this.oldData.length === 0) return Result.Cancel("No tile changed");

        const result = layer.setTilesAt(this.oldData);

        if (result.status === Result.Status.Success) currentSession.markAsDirty();

        return result
    }

    public delete(): void {
        this.data = [];
        this.oldData = [];
    }
}