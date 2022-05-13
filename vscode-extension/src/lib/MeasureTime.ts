import { performance } from "perf_hooks";
import { output } from "../features/Output";

export async function executeWithStopwatchAsync<T>(thenable: () => Thenable<T>, operation: string): Promise<T> {
    const start = performance.now();
    let result = await thenable();
    const duration = performance.now() - start;
    output.log(`[Duration] ${operation} took ${duration} milliseconds`);
    return result;
}

export function executeWithStopwatch<T>(func: Function, operation: string): T {
    const start = performance.now();
    let result = func();
    const duration = performance.now() - start;
    output.log(`[Duration] ${operation} took ${duration} milliseconds`);
    return result;
}
