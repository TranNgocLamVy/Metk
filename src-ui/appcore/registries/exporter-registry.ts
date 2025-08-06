import { BaseExporter } from "@/plugin-api";

export class ExporterRegistry {
    private static instance: ExporterRegistry;
    private exporters: Map<string, typeof BaseExporter>;

    private constructor() {
        this.exporters = new Map();
    }

    public static Instance(): ExporterRegistry {
        if (!this.instance) {
            this.instance = new ExporterRegistry();
        }
        return this.instance;
    }

    public registerExporter(name: string, exporter: typeof BaseExporter): void {
        this.exporters.set(name, exporter);
    }

    public getExporter(name: string): typeof BaseExporter | undefined {
        return this.exporters.get(name);
    }
}