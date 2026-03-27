const FailStatus = {
    Error: "Error",
    Cancel: "Cancel"
}
type FailStatus = keyof typeof FailStatus;

const ResultStatus = {
    Success: "Success",
    Error: "Error",
    Cancel: "Cancel"
} as const;

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

function ErrorResult<T = any>(message: string | undefined): ErrorResult<T> {
    console.trace(message);
    return { status: "Error", message };
}

function SuccessResult<T = any>(data?: T, message?: string | undefined): SuccessResult<T> {
    return { status: "Success", message, data: data as any};
}

function CancelResult<T = any>(message?: string): ErrorResult<T> {
    return { status: "Cancel", message };
}

export namespace Result {
    export const Success = SuccessResult;
    export const Error = ErrorResult;
    export const Cancel = CancelResult;
    export const Status = ResultStatus;
}