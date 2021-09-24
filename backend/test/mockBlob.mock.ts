import { Blob } from "../src/common/Blob";

export interface MockBlobDescriptor {
    constructor(name: string): void;
    read(ignoreError: boolean): Promise<any>;
    delete(): Promise<boolean>;
    readAll(token: string): Promise<any>;
    optimisticUpdate(update: Function, timeout?: number): Promise<any>;
    canDelete: boolean;
}

export const mockBlob = (content: any = {}, api: MockBlobDescriptor = {} as any) => {
    api.constructor = jest.fn();
    api.read = jest.fn();
    api.delete = jest.fn();
    api.readAll = jest.fn();
    api.optimisticUpdate = jest.fn();
    api.canDelete = true;

    (Blob as jest.Mock).mockImplementation((name) => {
        api.constructor(name);
        return {
            read: async (ignoreError) => {
                api.read(ignoreError);
                let result = content[name];
                return Promise.resolve(result || ignoreError && {} || undefined);
            },
            delete: async () => {
                api.delete();
                delete content[name];
                return Promise.resolve(api.canDelete);
            },
            optimisticUpdate: async (update, timeout) => {
                api.optimisticUpdate(update, timeout);
                return content[name] = await update();
            },
        };
    });
};
