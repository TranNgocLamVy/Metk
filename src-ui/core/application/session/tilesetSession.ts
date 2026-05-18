import { IBaseSession } from "@/core/interface/IBaseSession";
import { HistoryManager } from "@/core/manager/historyManager";
import { SelectionState } from "@/shared/schema/selectionState";
import { ViewState } from "@/shared/schema/viewState";
import { TilesetSessionData } from "@/shared/schema/tilesetSessionSchema";

import { Tileset } from "../tile/tileset";
import { TilesetView } from "../../../graphics/view/tilesetView";
import { EditorContext } from "../editorContext";
import EventEmitter from "eventemitter3";

interface TilesetSessionEvents {

}

export class TilesetSession extends EventEmitter<TilesetSessionEvents> implements IBaseSession {
    public readonly id: string;
    public readonly tileset: Tileset;
    public viewState: ViewState;
    public selectionState: SelectionState;
    private pivot: Coordinate | null = null;

    public historyManager: HistoryManager;

    constructor(tileset: Tileset, tilesetSessionData: TilesetSessionData, public readonly editorContext: EditorContext) {
        super();
        this.tileset = tileset;
        this.id = tilesetSessionData.id;
        this.viewState = tilesetSessionData.viewState ?? { x: null, y: null, zoom: 1 };
        this.selectionState = tilesetSessionData.selectionState ?? { selectedTilesSet: [], pivot: null };

        this.historyManager = new HistoryManager();
    }

    public async loadTilesetSession(): Promise<void> {
        const textureManager = this.editorContext.textureManager;
        await textureManager.retainTilesetGraphics(this.tileset);
    }

    public updateViewState(state: Partial<ViewState>) {
        this.viewState = { ...this.viewState, ...state };
    }

    public updateSelectionState(state: Partial<SelectionState>) {
        this.selectionState = { ...this.selectionState, ...state };
    }

    public updatePivot(pivot: Coordinate | null) {
        this.pivot = pivot;
    }

    public getPivot(): Coordinate | null {
        return this.pivot ? this.pivot : null;
    }

    public serialize(): TilesetSessionData {
        const selectionState: SelectionState = {
            selectedTilesSet: this.selectionState.selectedTilesSet,
            pivot: this.selectionState.pivot,
        }
        return {
            id: this.id,
            tilesetId: this.tileset.id,
            viewState: this.viewState,
            selectionState: selectionState,
        }
    }

    public destroy(): void {
        const textureManager = this.editorContext.textureManager;
        textureManager.releaseTilesetGraphics(this.tileset.id); // TODO: Move this to view
    }
}