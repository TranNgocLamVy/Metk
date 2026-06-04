import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { readFile } from "@tauri-apps/plugin-fs";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ImageCollectionTileset } from "@/editor/model/tileset/image-collection-tileset";
import { Tileset } from "@/editor/model/tileset/tileset";
import { Console } from "@/ui/notifications/console-gateway";
import { FileDialogUtils } from "@/shared/utils/file-dialog.utils";
import { PathUtils } from "@/shared/utils/path.utils";
import { TextureUtils } from "@/shared/utils/texture.utils";
import { useDialogStore } from "@/ui/stores/dialog.store";

export function useTilesetController(initialTileset: Tileset, dialogId: string) {
    const { closeDialog } = useDialogStore();

    const [version, setVersion] = useState(0);
    const [tileset] = useState<Tileset>(initialTileset);
    const [tilesetName, setTilesetName] = useState(initialTileset.name);
    const [selectedTileId, setSelectedTileId] = useState<number | null>(initialTileset.tiles[0]?.id ?? null);
    const [selectedCollisionObjectId, setSelectedCollisionObjectId] = useState<string | null>(null);

    const selectedTile = useMemo(() => {
        if (selectedTileId == null) return null;
        return tileset.getTileFromId(selectedTileId);
    }, [tileset, selectedTileId, version]);

    const selectedCollisionObject = useMemo(() => {
        if (!selectedTile) return null;
        if (selectedCollisionObjectId == null) return null;
        return selectedTile.collisionObjects.find((obj) => obj.id === selectedCollisionObjectId) || null;
    }, [selectedTile, selectedCollisionObjectId, version]);

    const triggerUpdate = useCallback(() => {
        setVersion((value) => value + 1);
    }, []);

    const selectTile = useCallback((tileId: number | null) => {
        setSelectedTileId(tileId);
        setSelectedCollisionObjectId(null);
    }, []);

    const selectCollisionObject = useCallback((objectId: string | null) => {
        setSelectedCollisionObjectId(objectId);
    }, []);

    const updateTilesetName = useCallback((name: string) => {
        setTilesetName(name);
    }, []);

    const addImageTiles = useCallback(async () => {
        if (!(tileset instanceof ImageCollectionTileset)) return;

        const currentWorkspace = appKernel.editorFacade.currentWorkspace;
        const defaultTextureDir = currentWorkspace?.savedPathManager.getTextureDir();

        const imageAbsPaths = await FileDialogUtils.open({
            title: "Add tiles",
            defaultPath: defaultTextureDir,
            multiple: true,
            filters: [
                {
                    name: "Images",
                    extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"],
                },
            ],
        });

        if (!imageAbsPaths || imageAbsPaths.length === 0) return;

        try {
            const imageSources = await Promise.all(
                imageAbsPaths.map(async (imageAbsPath) => {
                    const fileBuffer = await readFile(imageAbsPath);
                    const image = await TextureUtils.processImage(fileBuffer);

                    return {
                        source: tileset.tilesetPathSystem.getRelPathFromAbsPath(imageAbsPath),
                        width: image.width,
                        height: image.height,
                    };
                }),
            );

            currentWorkspace?.savedPathManager.setTextureDir(PathUtils.dirname(imageAbsPaths[0]));

            const addedTileIds = tileset.addImageTiles(imageSources);

            setSelectedTileId(addedTileIds[0] ?? null);
            setSelectedCollisionObjectId(null);
            triggerUpdate();
        } catch (error) {
            Console.error({
                message: "Failed to add tiles.",
                stacks: [String(error)],
            });
        }
    }, [tileset, triggerUpdate]);

    const removeSelectedTile = useCallback(() => {
        if (!(tileset instanceof ImageCollectionTileset)) return;
        if (selectedTileId == null) return;

        const selectedTileIndex = tileset.tiles.findIndex((tile) => tile.id === selectedTileId);
        if (!tileset.removeTile(selectedTileId)) return;

        const nextSelectedTile = tileset.tiles[Math.min(selectedTileIndex, tileset.tiles.length - 1)] ?? null;

        setSelectedTileId(nextSelectedTile?.id ?? null);
        setSelectedCollisionObjectId(null);
        triggerUpdate();
    }, [tileset, selectedTileId, triggerUpdate]);

    const handleCloseDialog = useCallback(() => {
        closeDialog(dialogId);
    }, [closeDialog, dialogId]);

    const updateTileset = useCallback(async () => {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return;

        const finalName = tilesetName.trim();

        if (finalName.length > 0) {
            tileset.name = finalName;
        }

        const tilesetManager = currentProject.tilesetManager;

        tilesetManager.updateTileset(tileset.serialize());
        const updatedTileset = tilesetManager.getTilesetById(tileset.id);
        if (updatedTileset && tileset instanceof ImageCollectionTileset) {
            await appKernel.editorFacade.textureManager.reloadTilesetGraphics(updatedTileset);
        }

        await tilesetManager.saveTileset(tileset.id);
        await appKernel.editorFacade.projectManager.saveCurrrentProject();

        closeDialog(dialogId);
    }, [tileset, tilesetName, closeDialog, dialogId]);

    const actions = useMemo(() => ({
        triggerUpdate,
        selectTile,
        selectCollisionObject,
        updateTilesetName,
        addImageTiles,
        removeSelectedTile,
        closeDialog: handleCloseDialog,
        updateTileset,
    }), [triggerUpdate, selectTile, selectCollisionObject, updateTilesetName, addImageTiles, removeSelectedTile, handleCloseDialog, updateTileset]);

    return {
        version,
        triggerUpdate,

        tileset,
        tilesetName,
        selectedTileId,
        selectedTile,
        selectedCollisionObject,

        actions,
    };
}

export type EditTilesetContextType = ReturnType<typeof useTilesetController>;

export const EditTilesetContext = createContext<EditTilesetContextType | null>(null);

export const useEditTileset = () => {
    const context = useContext(EditTilesetContext);
    if (!context) throw new Error("useEditTileset must be used within an EditTilesetProvider");
    return context;
};
