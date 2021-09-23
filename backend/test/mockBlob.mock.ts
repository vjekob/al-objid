import { Blob } from "../src/common/Blob";

// export const mockBlob = (fn: (...args: any[]) => any) => (Blob as jest.Mock).mockImplementation(fn);

interface BlobDescriptor {
    read?(ignoreError: boolean): any;
    delete?(): boolean;
    readAll?(token?: string): any;
    optimisticUpdate?(update: Function, timeout?: number);
}

export const mockBlob = (descriptor: BlobDescriptor = {}) => {
    const blob = {
        constructor: jest.fn(),

        read: jest.fn(async (ignoreError) => {
            if (descriptor.read) {
                return await descriptor.read(ignoreError);
            }
            return Promise.resolve(ignoreError ? {} : undefined);
        }),

        delete: jest.fn(async () => {
            if (descriptor.delete) {
                return await descriptor.delete();
            }
            return Promise.resolve(false);
        }),

        optimisticUpdate: jest.fn(async (update, timeout) => {
            if (descriptor.optimisticUpdate) {
                return await descriptor.optimisticUpdate(update, timeout);
            }
        })
    };

    (Blob as jest.Mock).mockImplementation((name) => {
        blob.constructor(name);
        return blob;
    });

    return blob;
};
