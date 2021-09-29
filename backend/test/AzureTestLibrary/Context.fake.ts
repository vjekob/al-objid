export const useContext = (method: string, body: any) => {
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
