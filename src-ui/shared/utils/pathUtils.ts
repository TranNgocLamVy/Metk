import { basename, dirname, extname, join, normalize, relative } from "pathe";

import { sep } from "@tauri-apps/api/path";

export class PathUtils {
    public static separator: string = sep();
    
    /**
     * 
     * @param pathStr 
     * @returns 
     */
    public static normalize(pathStr: string): string {
        return normalize(pathStr);
    }

    public static join(...paths: string[]): string {
        const normalizedPaths = paths.map((p) => this.normalize(p));
        return join(...normalizedPaths);
    }

    public static relative(from: string, to: string): string {
        return relative(this.normalize(from), this.normalize(to));
    }

    public static dirname(pathStr: string): string {
        return dirname(this.normalize(pathStr));
    }

    public static basename(pathStr: string, ext?: string): string {
        return basename(this.normalize(pathStr), ext);
    }

    public static extname(pathStr: string): string {
        return extname(this.normalize(pathStr));
    }

    public static async toUserFriendlyPath(pathStr: string): Promise<string> {
        const systemSeparator = await sep();
        if (systemSeparator === '\\') {
            return pathStr.replace(/\//g, '\\');
        }
        return pathStr;
    }
}