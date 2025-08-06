import { IProject } from "../interfaces/project";


export class Project implements IProject {
    public id: string;
    public name: string;
    public version: string;
    public description: string;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(data: IProject) {
        this.id = data.id;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}