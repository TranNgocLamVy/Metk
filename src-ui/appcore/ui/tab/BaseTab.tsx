import { Result } from "../../interface/common/result";

export abstract class BaseTab {
	abstract component: React.FC;
	abstract getId(): string;
	abstract getTitle(): string;
    abstract close(): Promise<Result>;
}
