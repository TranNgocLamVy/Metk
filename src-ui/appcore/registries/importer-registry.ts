import { BaseImporter } from "@/plugin-api";

export class ImporterRegistry {
    private importers: Map<string, typeof BaseImporter>;

    public constructor() {
        this.importers = new Map();
    }

    public registerImporter(name: string, importer: typeof BaseImporter): void {
        this.importers.set(name, importer);
    }

    public getImporter(name: string): typeof BaseImporter | undefined {
        return this.importers.get(name);
    }
}