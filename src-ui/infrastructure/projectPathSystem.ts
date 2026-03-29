import { PathUtils } from "@/shared/utils/pathUtils";

export class ProjectPathSystem {
    public children: Map<string, FilePathSystem> = new Map<string, FilePathSystem>();

    public constructor(
        public readonly absDir: string
    ) { }

    public addNode(node: FilePathSystem) {
        this.children.set(node.id, node);
    }

    public getNodeById(id: string): FilePathSystem | null {
        return this.children.get(id) ?? null;
    }

    public getAbsPathFromRelPath(relPath: string): string {
        return PathUtils.join(this.absDir, relPath);
    }
}

export class FilePathSystem {
    public relDir: string;
    public fileName: string;
    public readonly fileExtension: string;
    public constructor(
        public readonly id: string,
        public readonly parent: ProjectPathSystem, 
        relFilePath: string,
    ) {
        this.fileName = PathUtils.basename(relFilePath);
        this.fileExtension = PathUtils.extname(relFilePath);
        this.relDir = PathUtils.dirname(relFilePath);

        this.parent.addNode(this);
    }
    
    public getFileAbsPath(): string {
        return PathUtils.join(this.parent.absDir, this.relDir, this.fileName);
    }

    public getFileAbsDir(): string {
        return PathUtils.join(this.parent.absDir, this.relDir);
    }
    
    public getAbsPathFromRelPath(relPath: string): string {
        const absDir = PathUtils.join(this.parent.absDir, this.relDir);
        return PathUtils.join(absDir, relPath);
    }
}