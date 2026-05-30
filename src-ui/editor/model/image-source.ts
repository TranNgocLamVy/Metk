import { ImageSourceData } from "@/shared/data-types/image-source.data";

export class ImageSource {
    private _source: string;
    public get source(): string { return this._source }

    private _width: number;
    public get width(): number { return this._width }
    

    private _height: number;
    public get height(): number { return this._height }


    constructor(sourceData: ImageSourceData) {
        this._source = sourceData.source;
        this._width = sourceData.width;
        this._height = sourceData.height;
    }

    public setSource(sourceData: ImageSourceData) {
        this._source = sourceData.source;
        this._width = sourceData.width;
        this._height = sourceData.height;
    }

    public serialize(): ImageSourceData {
        return {
            source: this.source,
            width: this.width,
            height: this.height,
        }
    }
}