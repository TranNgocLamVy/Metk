import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { EntityCollection } from "@/editor/model/entity/entity-collection";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityGraphicType } from "@/shared/data-types/entity.data";

import { EntityGraphicOutputSelectorRenderer } from "./graphics/entity-graphic-output-selector.renderer";

export function useEntityDefinitionController(initialEntity: EntityDefinition, entityCollection: EntityCollection) {
    const [version, setVersion] = useState<number>(0);
    const triggerUpdate = useCallback(() => { setVersion((v) => v + 1); }, []);

    const [entity] = useState<EntityDefinition>(initialEntity);
    const [tilesetRefManager] = useState<TilesetRefManager>(() => {
        const currentProject = appKernel.editorFacade.currentProject;
        const manager = new TilesetRefManager(
            currentProject!.tilesetManager,
            entityCollection.entityCollectionPathSystem,
        );
        const refs = entityCollection.tilesetRefManager.serialize();
        manager.loadData(refs.refs, refs.nextIndex);
        return manager;
    });
    const [entityGraphicSelector] = useState<EntityGraphicOutputSelectorRenderer>(
        () => new EntityGraphicOutputSelectorRenderer(entity, tilesetRefManager, triggerUpdate),
    );

    const tilesetList = useMemo(() => {
        const currentProject = appKernel.editorFacade.currentProject;
        if (!currentProject) return [];
        return currentProject.tilesetManager.serialize();
    }, [version]);

    const dependedTilesets = useMemo(() => {
        return tilesetRefManager.serialize().refs;
    }, [tilesetRefManager, version]);

    const actions = useMemo(() => ({
        updateEntityName: (name: string) => {
            entity.rename(name.trim() === "" ? entity.id : name);
            triggerUpdate();
        },
        updateGraphicType: (type: EntityGraphicType) => {
            if (entity.graphic.type === type) return;

            if (type === EntityGraphicType.Color) {
                const color = entity.graphic.type === EntityGraphicType.Color ? entity.graphic.color : entity.color;
                entity.color = color;
                entity.setGraphic({
                    type: EntityGraphicType.Color,
                    color,
                });
                triggerUpdate();
                return;
            }

            const preferredTilesetId =
                dependedTilesets[0]?.id ??
                tilesetList[0]?.id ??
                "";

            if (preferredTilesetId) {
                tilesetRefManager.getTilesetRefIndex(preferredTilesetId);
            }

            entity.setGraphic({
                type: EntityGraphicType.Tile,
                tileId: 0,
                tilesetId: preferredTilesetId,
            });
            triggerUpdate();
        },
        updateColor: (color: string) => {
            entity.color = color;
            entity.setGraphic({
                type: EntityGraphicType.Color,
                color,
            });
            triggerUpdate();
        },
        selectTileset: async (tilesetId: string) => {
            tilesetRefManager.getTilesetRefIndex(tilesetId);
            await entityGraphicSelector.setActiveTileset(tilesetId);
            triggerUpdate();
        },
    }), [dependedTilesets, entity, entityGraphicSelector, tilesetList, tilesetRefManager, triggerUpdate]);

    return {
        version,
        triggerUpdate,

        entityCollection,
        entity,
        tilesetRefManager,
        entityGraphicSelector,

        tilesetList,
        dependedTilesets,

        actions,
    };
}

export type EditEntityDefinitionContextType = ReturnType<typeof useEntityDefinitionController>;

export const EditEntityDefinitionContext = createContext<EditEntityDefinitionContextType | null>(null);

export const useEditEntityDefinition = () => {
    const context = useContext(EditEntityDefinitionContext);
    if (!context) throw new Error("useEditEntityDefinition must be used within an EditEntityDefinitionProvider");
    return context;
};
