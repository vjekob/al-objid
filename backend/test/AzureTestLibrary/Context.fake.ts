import { RateLimiter } from "../../src/common/RateLimiter";

export const useContext = (method: string, body: any) => {
    RateLimiter.accept = jest.fn().mockReturnValue(true);
    return ({
        req: {
            headers: {},
            method,
            body,
        } as any,
        res: {
            status: 200,
            body: undefined
        } as any,
        log: jest.fn()
    }) as any;
};
