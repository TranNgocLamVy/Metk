
type ATRulesetData = {
    id: string
}

export class ATRuleSet {
    public get id(): string { return this.data.id; }
    constructor(private data: ATRulesetData) { }
}