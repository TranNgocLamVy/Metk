import { BaseObject } from "@/editor/model/base-object";
import EventEmitter from "eventemitter3";

interface EditorObjectRegistryEvent {
    onObjectAdded: (objectId: string) => void;
    onObjectDeleted: (object: string) => void;
}

export class EditorObjectRegistry extends EventEmitter<EditorObjectRegistryEvent> {
    private readonly objects: Map<string, BaseObject<any>> = new Map();

    public get size(): number {
        return this.objects.size;
    }

    public register<T extends BaseObject<any>>(object: T): T {
        const existingObject = this.objects.get(object.objectId);

        if (existingObject === object) {
            return object;
        }

        if (existingObject) {
            throw new Error(`Editor object already registered: ${object.objectId}`);
        }

        this.objects.set(object.objectId, object);
        this.emit("onObjectAdded", object.objectId);
        return object;
    }

    public registerTree<T extends BaseObject<any>>(rootObject: T): T {
        rootObject.traverseObjectTree((object) => this.register(object));
        return rootObject;
    }

    public unregister(objectOrId: BaseObject<any> | string): void {
        const objectId =
            typeof objectOrId === "string"
                ? objectOrId
                : objectOrId.objectId;
        this.objects.delete(objectId);
        this.emit("onObjectDeleted", objectId);
    }

    public unregisterTree(rootObject: BaseObject<any>): void {
        rootObject.traverseObjectTree((object) => this.unregister(object));
    }

    public get<T extends BaseObject = BaseObject<any>>(objectId: string): T | null {
        return (this.objects.get(objectId) as T | undefined) ?? null;
    }

    public has(objectId: string): boolean {
        return this.objects.has(objectId);
    }

    public values(): BaseObject<any>[] {
        return Array.from(this.objects.values());
    }

    public clear(): void {
        this.objects.clear();
    }
}
