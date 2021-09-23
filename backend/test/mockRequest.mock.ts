import { HttpMethod } from "@azure/functions";

export function mockRequest(method: HttpMethod, body: any = {}, bindings: any = {}) {
    let result = {
        req: {
            headers: {},
            method,
            body
        } as any,
        context: {
            res: {
                status: 200,
                body: undefined,
            },
            log: jest.fn(),
        } as any,
    };

    result.context.req = result.req;

    return result;
}
