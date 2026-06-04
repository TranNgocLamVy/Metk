import { v4 as uuidv4 } from "uuid";

import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { EntityFieldType } from "@/shared/data-types/entity.data";
import { RulesetData } from "@/shared/data-types/ruleset.data";
import { TilesetData } from "@/shared/data-types/tileset.data";

export function deepCloneResourceData<T>(data: T): T {
    return structuredClone(data);
}

export function cloneTilesetData(data: TilesetData): TilesetData {
    const clone = deepCloneResourceData(data);
    const sourceId = data.id;
    const tileIdStart = Math.max(-1, ...data.tiles.map((tile) => tile.id)) + 1;

    clone.id = uuidv4();
    clone.cloneFrom = sourceId;
    clone.tiles = clone.tiles.map((tile, index) => ({
        ...tile,
        id: tileIdStart + index,
        cloneFrom: String(data.tiles[index]?.id ?? tile.id),
        collisionObjects: tile.collisionObjects?.map((collisionObject) => ({
            ...collisionObject,
            id: uuidv4(),
            cloneFrom: collisionObject.id,
        })),
    }));

    return clone;
}

export function cloneRulesetData(data: RulesetData): RulesetData {
    const clone = deepCloneResourceData(data);
    const sourceId = data.id;

    clone.id = uuidv4();
    clone.cloneFrom = sourceId;
    clone.rules = clone.rules.map((rule) => ({
        ...rule,
        id: uuidv4(),
        cloneFrom: rule.id,
    }));
    clone.rulesets = {
        ...clone.rulesets,
        refs: clone.rulesets.refs.map((ref) => (
            ref.id === sourceId
                ? { ...ref, id: clone.id }
                : ref
        )),
    };

    return clone;
}

export function cloneEntityCollectionData(data: EntityCollectionData): EntityCollectionData {
    const clone = deepCloneResourceData(data);
    const sourceId = data.id;
    const entityIdMap = new Map(data.entities.map((entity) => [entity.id, uuidv4()]));

    clone.id = uuidv4();
    clone.cloneFrom = sourceId;
    clone.entities = clone.entities.map((entity) => {
        const sourceEntityId = entity.id;
        const clonedEntityId = entityIdMap.get(sourceEntityId) ?? uuidv4();

        return {
            ...entity,
            id: clonedEntityId,
            cloneFrom: sourceEntityId,
            fields: entity.fields?.map((field) => ({
                ...field,
                id: uuidv4(),
                cloneFrom: field.id,
                value: remapEntityFieldValue(field.type, field.value, entityIdMap),
            })),
        };
    });

    return clone;
}

function remapEntityFieldValue(
    fieldType: EntityFieldType,
    value: unknown,
    entityIdMap: Map<string, string>,
): unknown {
    if (fieldType !== EntityFieldType.EntityRef || typeof value !== "string") {
        return value;
    }

    return entityIdMap.get(value) ?? value;
}
