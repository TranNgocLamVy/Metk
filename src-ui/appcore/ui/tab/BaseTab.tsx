import { Result } from "../../interface/common/result";

export abstract class BaseTab {
    abstract id: string;
	abstract component: React.FC;
    abstract name: string;
    abstract close(): Promise<Result>;
}
