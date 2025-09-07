
export const ResultStatus = {
    Success: "Success",
    Error: "Error",
    Cancel: "Cancel"
} as const;
export type ResultStatus = keyof typeof ResultStatus;

export type Result = {
    status: ResultStatus;
    message?: string;
};