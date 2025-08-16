import { BaseExporter } from "@/plugin-api";

export class ExporterRegistry {
    private exporters: Map<string, typeof BaseExporter>;

    public constructor() {
        this.exporters = new Map();
    }

    public registerExporter(name: string, exporter: typeof BaseExporter): void {
        this.exporters.set(name, exporter);
    }

    public getExporter(name: string): typeof BaseExporter | undefined {
        return this.exporters.get(name);
    }
}