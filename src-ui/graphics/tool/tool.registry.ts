import { ResolvedToolDefinition, ToolAvailabilityContext, ToolFamilyDefinition, ToolGroupDefinition, ToolGroupId } from "@/graphics/tool/tool.definition";

const DEFAULT_PRIORITY = 1000;

const comparePriority = <T extends { priority?: number }>(a: T, b: T): number => {
    return (a.priority ?? DEFAULT_PRIORITY) - (b.priority ?? DEFAULT_PRIORITY);
};

export class ToolRegistry {
    private groups: Map<ToolGroupId, ToolGroupDefinition> = new Map();
    private families: Map<string, ToolFamilyDefinition> = new Map();
    private tools: Map<string, ResolvedToolDefinition> = new Map();
    private toolsByFamily: Map<string, ResolvedToolDefinition[]> = new Map();

    constructor(groups: ToolGroupDefinition[]) {
        groups.forEach((group) => {
            this.groups.set(group.id, group);

            group.families.forEach((family) => {
                this.families.set(family.id, family);

                const resolvedTools = family.tools.map((tool): ResolvedToolDefinition => ({
                    ...tool,
                    familyId: family.id,
                    groupId: group.id,
                }));

                resolvedTools.forEach((tool) => {
                    this.tools.set(tool.id, tool);
                });
                this.toolsByFamily.set(family.id, resolvedTools.sort(comparePriority));
            });
        });
    }

    public getGroups(): ToolGroupDefinition[] {
        return Array.from(this.groups.values()).sort(comparePriority);
    }

    public getFamilies(): ToolFamilyDefinition[] {
        return this.getGroups().flatMap((group) => this.getFamiliesByGroup(group.id));
    }

    public getFamiliesByGroup(groupId: ToolGroupId): ToolFamilyDefinition[] {
        return (this.groups.get(groupId)?.families ?? []).slice().sort(comparePriority);
    }

    public getFamily(familyId: string): ToolFamilyDefinition | null {
        return this.families.get(familyId) ?? null;
    }

    public getTool(toolId: string): ResolvedToolDefinition | null {
        return this.tools.get(toolId) ?? null;
    }

    public getToolsByFamily(familyId: string): ResolvedToolDefinition[] {
        return (this.toolsByFamily.get(familyId) ?? []).slice();
    }

    public resolveToolForFamily(familyId: string, ctx: ToolAvailabilityContext): ResolvedToolDefinition | null {
        const candidates = this.getToolsByFamily(familyId)
            .filter((tool) => tool.canUse(ctx))
            .sort(comparePriority);

        return candidates[0] ?? null;
    }

    public getAvailableFamilyIds(ctx: ToolAvailabilityContext): string[] {
        return this.getFamilies()
            .filter((family) => this.resolveToolForFamily(family.id, ctx) !== null)
            .map((family) => family.id);
    }
}

