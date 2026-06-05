export type ViewState = {
    x: number | null;
    y: number | null;
    zoom: number;
};

export const NORMAL_ZOOM_SCALE = 1;

export const createDefaultViewState = (): ViewState => ({
    x: null,
    y: null,
    zoom: NORMAL_ZOOM_SCALE,
});
