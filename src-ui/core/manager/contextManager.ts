export class ContextManager {
    private flags: Map<string, Set<string>> = new Map();
    private values: Map<string, string | number | boolean> = new Map();

    public setFlag(flag: string, isActive: boolean, instigatorId: string) {
        if (!this.flags.has(flag)) {
            this.flags.set(flag, new Set());
        }

        const instigators = this.flags.get(flag)!;
        
        if (isActive) {
            instigators.add(instigatorId);
        } else {
            instigators.delete(instigatorId);
        }
    }

    public setValue(key: string, value: string | number | boolean) {
        this.values.set(key, value);
    }

    public evaluateWhen(when?: string): boolean {
        if (!when) return true; 

        const orConditions = when.split('||').map(c => c.trim());
        
        return orConditions.some(orCondition => {
            const andConditions = orCondition.split('&&').map(c => c.trim());
            
            return andConditions.every(condition => {
                if (condition.includes('==')) {
                    const [key, val] = condition.split('==').map(s => s.trim());
                    const cleanVal = val.replace(/^["'](.+(?=["']$))["']$/, '$1'); 
                    return this.values.get(key) === cleanVal;
                }
                if (condition.includes('!=')) {
                    const [key, val] = condition.split('!=').map(s => s.trim());
                    const cleanVal = val.replace(/^["'](.+(?=["']$))["']$/, '$1');
                    return this.values.get(key) !== cleanVal;
                }

                if (condition.startsWith('!')) {
                    const flag = condition.substring(1).trim();
                    const instigators = this.flags.get(flag);
                    return !instigators || instigators.size === 0;
                }

                const instigators = this.flags.get(condition);
                return instigators && instigators.size > 0;
            });
        });
    }
}