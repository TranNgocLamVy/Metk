import { useLogStore } from "@/view/stores/debug/logStore";

export class LogService {
    static log(...args: any[]) {
        console.log(`[LogService]:`, ...args);
        const formattedMessage = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); 
                } catch (error) {
                    return '[Unserializable Object]';
                }
            }
            return String(arg);
        }).join(' ');

        useLogStore.getState().addLog(formattedMessage);
    }

    static clearLogs() {
        useLogStore.getState().clearLogs();
    }
}