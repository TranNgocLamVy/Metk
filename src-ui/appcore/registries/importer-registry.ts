import { BaseImporter } from "@/plugin-api";

export class ImporterRegistry {
    private static instance: ImporterRegistry;
    private importers: Map<string, typeof BaseImporter>;

    private constructor() {
        this.importers = new Map();
    }

    public static Instance(): ImporterRegistry {
        if (!this.instance) {
            this.instance = new ImporterRegistry();
        }
        return this.instance;
    }

    public registerImporter(name: string, importer: typeof BaseImporter): void {
        this.importers.set(name, importer);
    }

    public getImporter(name: string): typeof BaseImporter | undefined {
        return this.importers.get(name);
    }
}