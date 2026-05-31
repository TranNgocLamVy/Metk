import { basename, dirname, extname, join, normalize, relative } from "pathe";

const getSystemSeparator = (): "/" | "\\" => {
    const processPlatform = typeof process !== "undefined" ? process.platform : undefined;
    if (processPlatform === "win32") return "\\";

    const navigatorPlatform = typeof navigator !== "undefined" ? navigator.platform : undefined;
    if (navigatorPlatform && /win/i.test(navigatorPlatform)) return "\\";

    return "/";
};

const toSlashPath = (pathStr: string): string => {
    return normalize(pathStr).replace(/\\/g, "/");
};

const isWindowsLikePath = (pathStr: string): boolean => {
    return /^[a-zA-Z]:\//.test(toSlashPath(pathStr));
};

const isWindowsDriveSegment = (segment: string | undefined): boolean => {
    return !!segment && /^[a-zA-Z]:$/.test(segment);
};

const relativeWindowsCaseInsensitive = (from: string, to: string): string => {
    const normalizedFrom = toSlashPath(from);
    const normalizedTo = toSlashPath(to);

    const fromParts = normalizedFrom.split("/").filter(Boolean);
    const toParts = normalizedTo.split("/").filter(Boolean);

    const fromDrive = fromParts[0];
    const toDrive = toParts[0];

    if (
        isWindowsDriveSegment(fromDrive) &&
        isWindowsDriveSegment(toDrive) &&
        fromDrive.toLowerCase() !== toDrive.toLowerCase()
    ) {
        return normalizedTo;
    }

    let commonLength = 0;

    while (
        commonLength < fromParts.length &&
        commonLength < toParts.length &&
        fromParts[commonLength].toLowerCase() === toParts[commonLength].toLowerCase()
    ) {
        commonLength++;
    }

    const parentSegments = Array.from(
        { length: fromParts.length - commonLength },
        () => ".."
    );

    const childSegments = toParts.slice(commonLength);
    const relativePath = [...parentSegments, ...childSegments].join("/");

    return relativePath || ".";
};

export class PathUtils {
    public static separator: string = getSystemSeparator();

    public static normalize(pathStr: string): string {
        return normalize(pathStr);
    }

    public static join(...paths: string[]): string {
        const normalizedPaths = paths.map((p) => this.normalize(p));
        return join(...normalizedPaths);
    }

    public static relative(from: string, to: string): string {
        const normalizedFrom = this.normalize(from);
        const normalizedTo = this.normalize(to);

        if (
            getSystemSeparator() === "\\" ||
            isWindowsLikePath(normalizedFrom) ||
            isWindowsLikePath(normalizedTo)
        ) {
            return relativeWindowsCaseInsensitive(normalizedFrom, normalizedTo);
        }

        return relative(normalizedFrom, normalizedTo);
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

    public static toUserFriendlyPath(pathStr: string): string {
        const systemSeparator = getSystemSeparator();
        if (systemSeparator === "\\") {
            return pathStr.replace(/\//g, "\\");
        }
        return pathStr;
    }
}