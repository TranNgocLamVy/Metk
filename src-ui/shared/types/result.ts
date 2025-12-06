
const SuccessStatus = "Success";
type SuccessStatus = typeof SuccessStatus;

const FailStatus = {
    Error: "Error",
    Cancel: "Cancel"
}
type FailStatus = keyof typeof FailStatus;

export const ResultStatus = {
    Success: "Success",
    Error: "Error",
    Cancel: "Cancel"
} as const;
export type ResultStatus = SuccessStatus | FailStatus;

export type Result<T = any> = SuccessResult<T> | ErrorResult<T>;

type ErrorResult<T = any> = {
    status: FailStatus;
    message?: string;
    data?: T;
};

type SuccessResult<T = any> = {
    status: "Success";
    message?: string;
    data: T;
};