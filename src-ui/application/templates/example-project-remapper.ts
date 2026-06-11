import { v4 as uuidv4 } from "uuid";

import { normalizeEntityCollectionData } from "@/editor/model/entity/entity.normalizer";
import { normalizeProjectData } from "@/editor/model/project/project.normalizer";
import { normalizeRulesetData } from "@/editor/model/ruleset/ruleset.normalizer";
import { normalizeTilemapData } from "@/editor/model/tilemap/tilemap.normalizer";
import { normalizeTilesetData } from "@/editor/model/tileset/tileset.normalizer";
import { normalizeWorkspaceData } from "@/editor/model/workspace/workspace.normalizer";
import { IFileSystemService } from "@/infrastructure/interface/file-system-service.interface";
import { JsonSerializer } from "@/infrastructure/json.serializer";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { EntityDefinitionData, EntityFieldData, EntityFieldType, EntityGraphicData } from "@/shared/data-types/entity.data";
import { CollisionObjectData } from "@/shared/data-types/collision-object.data";
import { EntityInstanceData, LayerData, RootLayerData } from "@/shared/data-types/layer.data";
import { ProjectData } from "@/shared/data-types/project.data";
import { RulesetData } from "@/shared/data-types/ruleset.data";
import { TilemapData } from "@/shared/data-types/tilemap.data";
import { TileData, TilesetData } from "@/shared/data-types/tileset.data";
import { WorkpsaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/path.utils";

type RemapProjectPayload = {
    projectAbsDir: string;
    projectEntryRelPath: string;
    projectName: string;
    preserveCloneSource: boolean;
};

type LoadedResource<T> = {
    relPath: string;
    absPath: string;
    data: T;
};

type LoadedProjectGraph = {
    project: LoadedResource<ProjectData>;
    tilemaps: LoadedResource<TilemapData>[];
    tilesets: LoadedResource<TilesetData>[];
    rulesets: LoadedResource<RulesetData>[];
    entityCollections: LoadedResource<EntityCollectionData>[];
    workspaceSession?: LoadedResource<WorkpsaceData>;
};

export class ExampleProjectRemapper {
    private readonly serializer = new JsonSerializer<unknown>();

    public constructor(private readonly fileSystem: IFileSystemService) {}

    public async remapProject(payload: RemapProjectPayload): Promise<Result> {
        const graphResult = await this.loadProjectGraph(payload.projectAbsDir, payload.projectEntryRelPath);
        if (graphResult.status !== Result.Status.Success) return graphResult;

        const idMap = this.collectPersistentIds(graphResult.data);
        const now = new Date().toISOString();
        const remappedGraph = this.remapProjectGraph(graphResult.data, idMap, {
            now,
            projectName: payload.projectName,
            preserveCloneSource: payload.preserveCloneSource,
        });

        return await this.saveProjectGraph(remappedGraph);
    }

    private async loadProjectGraph(projectAbsDir: string, projectEntryRelPath: string): Promise<Result<LoadedProjectGraph>> {
        const projectAbsPath = PathUtils.join(projectAbsDir, projectEntryRelPath);
        const projectResult = await this.loadJson<ProjectData>(
            projectAbsPath,
            (value) => normalizeProjectData(value),
            "project",
        );

        if (projectResult.status !== Result.Status.Success) return Result.Error(projectResult.message, projectResult);

        const project = projectResult.data;
        const tilemaps = await this.loadReferencedResources(
            project.data.tilemaps,
            projectAbsDir,
            "tilemapRelPath",
            normalizeTilemapData,
            "tilemap",
        );
        if (tilemaps.status !== Result.Status.Success) return Result.Error(tilemaps.message, tilemaps);

        const tilesets = await this.loadReferencedResources(
            project.data.tilesets,
            projectAbsDir,
            "tilesetRelPath",
            normalizeTilesetData,
            "tileset",
        );
        if (tilesets.status !== Result.Status.Success) return Result.Error(tilesets.message, tilesets);

        const rulesets = await this.loadReferencedResources(
            project.data.rulesets,
            projectAbsDir,
            "rulesetRelPath",
            normalizeRulesetData,
            "ruleset",
        );
        if (rulesets.status !== Result.Status.Success) return Result.Error(rulesets.message, rulesets);

        const entityCollections = await this.loadReferencedResources(
            project.data.entityCollections,
            projectAbsDir,
            "entityCollectionRelPath",
            normalizeEntityCollectionData,
            "entity collection",
        );
        if (entityCollections.status !== Result.Status.Success) return Result.Error(entityCollections.message, entityCollections);

        const workspaceSession = await this.loadWorkspaceSessionIfPresent(projectAbsDir);
        if (workspaceSession.status !== Result.Status.Success) return Result.Error(workspaceSession.message, workspaceSession);

        return Result.Success({
            project,
            tilemaps: tilemaps.data,
            tilesets: tilesets.data,
            rulesets: rulesets.data,
            entityCollections: entityCollections.data,
            workspaceSession: workspaceSession.data,
        });
    }

    private async loadWorkspaceSessionIfPresent(projectAbsDir: string): Promise<Result<LoadedResource<WorkpsaceData> | undefined>> {
        const sessionRelPath = PathUtils.join(".metk", "session.json");
        const sessionAbsPath = PathUtils.join(projectAbsDir, sessionRelPath);

        if (!(await this.fileSystem.exists(sessionAbsPath))) return Result.Success(undefined);

        const sessionResult = await this.loadJson<WorkpsaceData>(
            sessionAbsPath,
            (value) => normalizeWorkspaceData(value),
            "workspace session",
        );

        if (sessionResult.status !== Result.Status.Success) return Result.Error(sessionResult.message, sessionResult);

        return Result.Success({
            ...sessionResult.data,
            relPath: sessionRelPath,
        });
    }

    private async loadReferencedResources<TResource, TMetadata extends Record<string, unknown>>(
        metadataItems: TMetadata[],
        projectAbsDir: string,
        relPathKey: keyof TMetadata & string,
        normalize: (value: unknown) => TResource,
        resourceName: string,
    ): Promise<Result<LoadedResource<TResource>[]>> {
        const resources: LoadedResource<TResource>[] = [];

        for (const metadata of metadataItems) {
            const relPath = metadata[relPathKey];
            const metadataId = metadata.id;
            if (typeof relPath !== "string" || typeof metadataId !== "string") {
                return Result.Error({
                    key: "message.project.exampleTemplate.resourceMetadataInvalid",
                    options: { resourceName },
                });
            }

            const absPath = PathUtils.join(projectAbsDir, relPath);
            const resourceResult = await this.loadJson(absPath, normalize, resourceName);
            if (resourceResult.status !== Result.Status.Success) return Result.Error(resourceResult.message, resourceResult);

            if (hasStringId(resourceResult.data.data) && resourceResult.data.data.id !== metadataId) {
                return Result.Error({
                    key: "message.project.exampleTemplate.resourceIdMismatch",
                    options: {
                        resourceName,
                        metadataId,
                        fileId: resourceResult.data.data.id,
                    },
                });
            }

            resources.push({
                relPath,
                absPath,
                data: resourceResult.data.data,
            });
        }

        return Result.Success(resources);
    }

    private async loadJson<T>(
        absPath: string,
        normalize: (value: unknown) => T,
        resourceName: string,
    ): Promise<Result<LoadedResource<T>>> {
        let content: string;
        try {
            content = await this.fileSystem.readTextFile(absPath);
        } catch (error) {
            return Result.Error({
                key: "message.project.exampleTemplate.resourceFileMissing",
                options: { resourceName, path: absPath, error: String(error) },
            });
        }

        const deserializeResult = this.serializer.deserialize(content);
        if (deserializeResult.status !== Result.Status.Success) {
            return Result.Error({
                key: "message.project.exampleTemplate.resourceInvalidJson",
                options: { resourceName, path: absPath },
            }, deserializeResult);
        }

        try {
            return Result.Success({
                relPath: "",
                absPath,
                data: normalize(deserializeResult.data),
            });
        } catch (error) {
            return Result.Error({
                key: "message.project.exampleTemplate.resourceDataInvalid",
                options: { resourceName, path: absPath, error: String(error) },
            });
        }
    }

    private collectPersistentIds(graph: LoadedProjectGraph): Map<string, string> {
        const ids = new Set<string>();

        addId(ids, graph.project.data.id);
        graph.project.data.tilemaps.forEach((metadata) => addId(ids, metadata.id));
        graph.project.data.tilesets.forEach((metadata) => addId(ids, metadata.id));
        graph.project.data.rulesets.forEach((metadata) => addId(ids, metadata.id));
        graph.project.data.entityCollections.forEach((metadata) => addId(ids, metadata.id));

        graph.tilemaps.forEach(({ data }) => {
            addId(ids, data.id);
            collectLayerIds(ids, data.layers);
        });

        graph.tilesets.forEach(({ data }) => {
            addId(ids, data.id);
            data.tiles.forEach((tile) => {
                tile.collisionObjects?.forEach((collisionObject) => addId(ids, collisionObject.id));
            });
        });

        graph.rulesets.forEach(({ data }) => {
            addId(ids, data.id);
            data.rules.forEach((rule) => addId(ids, rule.id));
        });

        graph.entityCollections.forEach(({ data }) => {
            addId(ids, data.id);
            data.entities.forEach((entity) => {
                addId(ids, entity.id);
                entity.fields?.forEach((field) => addId(ids, field.id));
            });
        });

        const session = graph.workspaceSession?.data;
        session?.tilemapEditorWorkspace.tilesets.tilesetSessions.forEach((tilesetSession) => addId(ids, tilesetSession.id));
        session?.tilemapEditorWorkspace.tilemaps.tilemapSessions.forEach((tilemapSession) => addId(ids, tilemapSession.id));

        return new Map(Array.from(ids).map((id) => [id, uuidv4()]));
    }

    private remapProjectGraph(
        graph: LoadedProjectGraph,
        idMap: Map<string, string>,
        options: {
            now: string;
            projectName: string;
            preserveCloneSource: boolean;
        },
    ): LoadedProjectGraph {
        return {
            project: {
                ...graph.project,
                data: remapProjectData(graph.project.data, idMap, options.projectName, options.now),
            },
            tilemaps: graph.tilemaps.map((resource) => ({
                ...resource,
                data: remapTilemapData(resource.data, idMap),
            })),
            tilesets: graph.tilesets.map((resource) => ({
                ...resource,
                data: remapTilesetData(resource.data, idMap, options.preserveCloneSource),
            })),
            rulesets: graph.rulesets.map((resource) => ({
                ...resource,
                data: remapRulesetData(resource.data, idMap, options.preserveCloneSource),
            })),
            entityCollections: graph.entityCollections.map((resource) => ({
                ...resource,
                data: remapEntityCollectionData(resource.data, idMap, options.now, options.preserveCloneSource),
            })),
            workspaceSession: graph.workspaceSession
                ? {
                    ...graph.workspaceSession,
                    data: remapWorkspaceSessionData(graph.workspaceSession.data, idMap),
                }
                : undefined,
        };
    }

    private async saveProjectGraph(graph: LoadedProjectGraph): Promise<Result> {
        const resources: LoadedResource<unknown>[] = [
            graph.project,
            ...graph.tilemaps,
            ...graph.tilesets,
            ...graph.rulesets,
            ...graph.entityCollections,
            ...(graph.workspaceSession ? [graph.workspaceSession] : []),
        ];

        for (const resource of resources) {
            const serialized = this.serializer.serialize(resource.data);
            if (serialized.status !== Result.Status.Success) return serialized;

            const saveResult = await this.fileSystem.writeTextFile(resource.absPath, serialized.data);
            if (saveResult.status !== Result.Status.Success) {
                return Result.Error({
                    key: "message.project.exampleTemplate.resourceSaveFail",
                    options: { path: resource.absPath },
                }, saveResult);
            }
        }

        return Result.Success();
    }
}

function remapProjectData(project: ProjectData, idMap: Map<string, string>, projectName: string, now: string): ProjectData {
    return {
        ...project,
        id: remapRequiredId(project.id, idMap),
        name: projectName,
        createdAt: now,
        updatedAt: now,
        tilemaps: project.tilemaps.map((metadata) => ({
            ...metadata,
            id: remapRequiredId(metadata.id, idMap),
        })),
        tilesets: project.tilesets.map((metadata) => ({
            ...metadata,
            id: remapRequiredId(metadata.id, idMap),
        })),
        rulesets: project.rulesets.map((metadata) => ({
            ...metadata,
            id: remapRequiredId(metadata.id, idMap),
        })),
        entityCollections: project.entityCollections.map((metadata) => ({
            ...metadata,
            id: remapRequiredId(metadata.id, idMap),
        })),
    };
}

function remapTilemapData(tilemap: TilemapData, idMap: Map<string, string>): TilemapData {
    return {
        ...tilemap,
        id: remapRequiredId(tilemap.id, idMap),
        tilesets: {
            ...tilemap.tilesets,
            refs: tilemap.tilesets.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
        rulesets: {
            ...tilemap.rulesets,
            refs: tilemap.rulesets.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
        entityCollections: {
            ...tilemap.entityCollections,
            refs: tilemap.entityCollections.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
        layers: remapLayers(tilemap.layers, idMap),
    };
}

function remapTilesetData(tileset: TilesetData, idMap: Map<string, string>, preserveCloneSource: boolean): TilesetData {
    return {
        ...tileset,
        id: remapRequiredId(tileset.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: tileset.id } : {}),
        tiles: tileset.tiles.map((tile) => remapTileData(tile, idMap, preserveCloneSource)),
    };
}

function remapTileData(tile: TileData, idMap: Map<string, string>, preserveCloneSource: boolean): TileData {
    return {
        ...tile,
        ...(preserveCloneSource ? { cloneFrom: String(tile.id) } : {}),
        collisionObjects: tile.collisionObjects?.map((collisionObject) => remapCollisionObject(collisionObject, idMap, preserveCloneSource)),
    };
}

function remapCollisionObject(
    collisionObject: CollisionObjectData,
    idMap: Map<string, string>,
    preserveCloneSource: boolean,
): CollisionObjectData {
    return {
        ...collisionObject,
        id: remapRequiredId(collisionObject.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: collisionObject.id } : {}),
    };
}

function remapRulesetData(ruleset: RulesetData, idMap: Map<string, string>, preserveCloneSource: boolean): RulesetData {
    return {
        ...ruleset,
        id: remapRequiredId(ruleset.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: ruleset.id } : {}),
        rules: ruleset.rules.map((rule) => ({
            ...rule,
            id: remapRequiredId(rule.id, idMap),
            ...(preserveCloneSource ? { cloneFrom: rule.id } : {}),
        })),
        tilesets: {
            ...ruleset.tilesets,
            refs: ruleset.tilesets.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
        rulesets: {
            ...ruleset.rulesets,
            refs: ruleset.rulesets.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
    };
}

function remapEntityCollectionData(
    entityCollection: EntityCollectionData,
    idMap: Map<string, string>,
    now: string,
    preserveCloneSource: boolean,
): EntityCollectionData {
    return {
        ...entityCollection,
        id: remapRequiredId(entityCollection.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: entityCollection.id } : {}),
        entities: entityCollection.entities.map((entity) => remapEntityDefinitionData(entity, idMap, preserveCloneSource)),
        tilesets: {
            ...entityCollection.tilesets,
            refs: entityCollection.tilesets.refs.map((ref) => ({ ...ref, id: remapKnownId(ref.id, idMap) })),
        },
        createdAt: now,
        updatedAt: now,
    };
}

function remapEntityDefinitionData(
    entity: EntityDefinitionData,
    idMap: Map<string, string>,
    preserveCloneSource: boolean,
): EntityDefinitionData {
    return {
        ...entity,
        id: remapRequiredId(entity.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: entity.id } : {}),
        graphic: remapEntityGraphicData(entity.graphic, idMap),
        fields: entity.fields?.map((field) => remapEntityFieldData(field, idMap, preserveCloneSource)),
    };
}

function remapEntityFieldData(
    field: EntityFieldData,
    idMap: Map<string, string>,
    preserveCloneSource: boolean,
): EntityFieldData {
    return {
        ...field,
        id: remapRequiredId(field.id, idMap),
        ...(preserveCloneSource ? { cloneFrom: field.id } : {}),
        value: remapEntityFieldValue(field, idMap),
    };
}

function remapEntityFieldValue(field: EntityFieldData, idMap: Map<string, string>): unknown {
    if (field.type !== EntityFieldType.EntityRef) return remapKnownIdsInUnknown(field.value, idMap);
    return remapKnownIdsInUnknown(field.value, idMap);
}

function remapEntityGraphicData(graphic: EntityGraphicData, idMap: Map<string, string>): EntityGraphicData {
    if (graphic.type !== "tile") return graphic;
    return {
        ...graphic,
        tilesetId: remapKnownId(graphic.tilesetId, idMap),
    };
}

function remapLayers(layers: RootLayerData, idMap: Map<string, string>): RootLayerData {
    return layers.map((layer) => remapLayerData(layer, idMap));
}

function remapLayerData(layer: LayerData, idMap: Map<string, string>): LayerData {
    const remappedLayer = {
        ...layer,
        id: remapRequiredId(layer.id, idMap),
    };

    if (remappedLayer.type === "group") {
        return {
            ...remappedLayer,
            layers: remappedLayer.layers?.map((childLayer) => remapLayerData(childLayer, idMap)),
        };
    }

    if (remappedLayer.type === "entity") {
        return {
            ...remappedLayer,
            entities: remappedLayer.entities.map((entity) => remapEntityInstanceData(entity, idMap)),
        };
    }

    return remappedLayer;
}

function remapEntityInstanceData(entity: EntityInstanceData, idMap: Map<string, string>): EntityInstanceData {
    return {
        ...entity,
        id: remapRequiredId(entity.id, idMap),
        entityRef: {
            entityCollectionId: remapKnownId(entity.entityRef.entityCollectionId, idMap),
            entityDefinitionId: remapKnownId(entity.entityRef.entityDefinitionId, idMap),
        },
        fields: entity.fields ? remapFieldRecord(entity.fields, idMap) : undefined,
    };
}

function remapWorkspaceSessionData(workspace: WorkpsaceData, idMap: Map<string, string>): WorkpsaceData {
    const tilesets = workspace.tilemapEditorWorkspace.tilesets;
    const tilemaps = workspace.tilemapEditorWorkspace.tilemaps;
    const ruleset = workspace.tilemapEditorWorkspace.ruleset;
    const entityCollection = workspace.tilemapEditorWorkspace.entityCollection;
    const propertyPanel = workspace.tilemapEditorWorkspace.propertyPanel;

    return {
        ...workspace,
        tilemapEditorWorkspace: {
            ...workspace.tilemapEditorWorkspace,
            tilesets: {
                ...tilesets,
                tilesetSessions: tilesets.tilesetSessions.map((session) => ({
                    ...session,
                    id: remapRequiredId(session.id, idMap),
                    tilesetId: remapKnownId(session.tilesetId, idMap),
                })),
                currentTilesetSessionId: remapNullableId(tilesets.currentTilesetSessionId, idMap),
            },
            tilemaps: {
                ...tilemaps,
                tilemapSessions: tilemaps.tilemapSessions.map((session) => ({
                    ...session,
                    id: remapRequiredId(session.id, idMap),
                    tilemapId: remapKnownId(session.tilemapId, idMap),
                    layerState: session.layerState
                        ? {
                            ...session.layerState,
                            selectedLayers: session.layerState.selectedLayers.map((id) => remapKnownId(id, idMap)),
                        }
                        : session.layerState,
                })),
                currentTilemapSessionId: remapNullableId(tilemaps.currentTilemapSessionId, idMap),
            },
            ruleset: {
                ...ruleset,
                selectedRuleId: remapNullableId(ruleset.selectedRuleId, idMap),
            },
            entityCollection: {
                ...entityCollection,
                selectedEntityCollectionId: remapNullableId(entityCollection.selectedEntityCollectionId, idMap),
                selectedEntityId: remapNullableId(entityCollection.selectedEntityId, idMap),
            },
            propertyPanel: {
                ...propertyPanel,
                selectedObjectId: propertyPanel.selectedObjectId
                    ? remapObjectIdString(propertyPanel.selectedObjectId, idMap)
                    : null,
            },
        },
        savedPath: {
            ...workspace.savedPath,
            exportPaths: workspace.savedPath.exportPaths.map((exportPath) => ({
                ...exportPath,
                tilemapId: remapKnownId(exportPath.tilemapId, idMap),
            })),
        },
    };
}

function remapFieldRecord(fields: Record<string, unknown>, idMap: Map<string, string>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
            remapKnownId(key, idMap),
            remapKnownIdsInUnknown(value, idMap),
        ]),
    );
}

function remapKnownIdsInUnknown(value: unknown, idMap: Map<string, string>): unknown {
    if (typeof value === "string") return remapKnownId(value, idMap);
    if (Array.isArray(value)) return value.map((item) => remapKnownIdsInUnknown(item, idMap));
    if (!isRecord(value)) return value;

    return Object.fromEntries(
        Object.entries(value).map(([key, childValue]) => [
            remapKnownId(key, idMap),
            remapKnownIdsInUnknown(childValue, idMap),
        ]),
    );
}

function collectLayerIds(ids: Set<string>, layers: RootLayerData): void {
    layers.forEach((layer) => {
        addId(ids, layer.id);

        if (layer.type === "group") {
            collectLayerIds(ids, layer.layers ?? []);
            return;
        }

        if (layer.type === "entity") {
            layer.entities.forEach((entity) => addId(ids, entity.id));
        }
    });
}

function addId(ids: Set<string>, id: unknown): void {
    if (typeof id === "string" && id.length > 0) ids.add(id);
}

function remapRequiredId(id: string, idMap: Map<string, string>): string {
    return idMap.get(id) ?? id;
}

function remapKnownId(id: string, idMap: Map<string, string>): string {
    return idMap.get(id) ?? id;
}

function remapNullableId(id: string | null, idMap: Map<string, string>): string | null {
    return id ? remapKnownId(id, idMap) : null;
}

function remapObjectIdString(objectId: string, idMap: Map<string, string>): string {
    let remapped = objectId;
    for (const [oldId, newId] of idMap) {
        remapped = remapped.replaceAll(oldId, newId);
    }
    return remapped;
}

function hasStringId(value: unknown): value is { id: string } {
    return isRecord(value) && typeof value.id === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
