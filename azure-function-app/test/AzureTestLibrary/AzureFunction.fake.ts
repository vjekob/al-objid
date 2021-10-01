import { AzureFunction } from "@azure/functions";
import { RateLimiter } from "../../src/common/RateLimiter";

export class FakeAzureFunction {
    private _function: AzureFunction;

    constructor(module: string) {
        RateLimiter.accept = jest.fn().mockReturnValue(true);
        this._function = require(`../${module}`).default as AzureFunction;
    }

    async invoke(method: string, body: any = undefined, bindings: any = {}): Promise<any> {
        const context = {
            req: {
                headers: {},
                method,
                body
            } as any,
            res: {
                status: 200,
                body: undefined,
            },
            log: jest.fn(),
            bindings,
        } as any;

        await this._function(context, context.req && {...context.req});

        return context.res;
    }
}
