
export const ResultStatus = {
    Success: "Success",
    Error: "Error",
    Cancel: "Cancel"
} as const;
export type ResultStatus = keyof typeof ResultStatus;

type ResultData = {
    status: ResultStatus;
    message?: string;
}
export type Result = ResultData | Promise<ResultData>;