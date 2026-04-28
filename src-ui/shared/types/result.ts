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
    message?: TranslatableMessage;
    stacks?: TranslatableMessage[];
    data?: T;
};

type SuccessResult<T = any> = {
    status: "Success";
    message?: TranslatableMessage;
    data: T;
};

function ErrorResult<T = any>(input?: TranslatableMessage, stacksResult?: ErrorResult): ErrorResult<T> {
    const message: TranslatableMessage = typeof input === "string" ? { key: input } : input ?? "";
    const stacks = [ stacksResult?.message, ...(stacksResult?.stacks ?? []) ];
    return { status: "Error", message: message, stacks: stacks.filter(stacks => stacks !== undefined) };
}

function SuccessResult<T = any>(data?: T, input?: TranslatableMessage): SuccessResult<T> {
    const message = typeof input === "string" ? { key: input } : input;
    return { status: "Success", message: message, data: data as any};
}

function CancelResult<T = any>(input?: TranslatableMessage): ErrorResult<T> {
    const message = typeof input === "string" ? { key: input } : input;
    return { status: "Cancel", message };
}

export namespace Result {
    export const Success = SuccessResult;
    export const Error = ErrorResult;
    export const Cancel = CancelResult;
    export const Status = ResultStatus;
}