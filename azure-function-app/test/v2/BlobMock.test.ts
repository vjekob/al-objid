import { blob } from "stream/consumers";
import { Blob } from "../../src/common/Blob";
import { AzureTestLibrary } from "../AzureTestLibrary";

jest.mock("azure-storage");

describe("Testing Blob mock functionality (necessary for correctness of other tests)", () => {
    test("Exists returns true when blob exists", async () => {
        let name = "__mock__";
        AzureTestLibrary.Fake.useStorage({ [name]: {} });
        const blob = new Blob(name);
        expect(await blob.exists()).toBe(true);
    });

    test("Exists returns false when blob does not exist", async () => {
        let name = "__mock__";
        AzureTestLibrary.Fake.useStorage({});
        const blob = new Blob(name);
        expect(await blob.exists()).toBe(false);
    });

    it("Successfully reads from an existing blob", async () => {
        let name = "__mock__";
        AzureTestLibrary.Fake.useStorage({ [name]: { hello: "World" } });
        const blob = new Blob(name);
        let result: any = await blob.read();
        expect(result).toBeDefined();
        expect(result.hello).toBe("World");
    });

    it("Reads null from a non-existent blob", async () => {
        let name = "__mock__";
        AzureTestLibrary.Fake.useStorage({});
        const blob = new Blob(name);
        let result: any = await blob.read();
        expect(result).toStrictEqual(null);
    });

    it("Reads empty object from a non-existent blob when ignoreError is set", async () => {
        let name = "__mock__";
        AzureTestLibrary.Fake.useStorage({});
        const blob = new Blob(name);
        let result: any = await blob.read(true);
        expect(result).toEqual({});
    });

    it("Successfully deletes an existing blob", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);
        const blob = new Blob(name);
        let result = await blob.delete();
        expect(result).toStrictEqual(true);
        expect(storage).toEqual({});
    });

    it("Returns false when deleting a non-existent blob", async () => {
        let name = "__mock__";
        let nonExistentName = "__fake__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);
        const blob = new Blob(nonExistentName);
        let result = await blob.delete();
        expect(result).toStrictEqual(false);
        expect(storage).toEqual({ ...storage });
    });

    it("Updates contents of blob", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);
        const blob = new Blob(name);
        await blob.optimisticUpdate((data: any) => ({ ...data, hello: `${data.hello.toUpperCase()}!`, bye: "Moon" }));
        expect(storage[name].hello).toBe("WORLD!");
        expect((storage[name] as any).bye).toBe("Moon");
    });

    it("Successfully updates contents of blob in multi-request concurrent process", async () => {
        let name = "__mock__";
        let storage = { [name]: [] };
        AzureTestLibrary.Fake.useStorage(storage);

        const getPromise = (id: number) => new Promise<void>(fulfill => {
            const blob = new Blob(name);
            setTimeout(async () => {
                await blob.optimisticUpdate((data: number[]) => ([...data, id]))
                fulfill();
            }, Math.round(Math.random() * 2));
        });

        let promises = [];
        for (let i = 0; i < 15; i++) {
            promises.push(getPromise(i));
        }
        await Promise.all(promises);

        expect(storage[name].length).toBe(15);
        for (let i = 0; i < 15; i++) {
            expect(storage[name].includes(i)).toStrictEqual(true);
        }
    });

    it("Locks an unlocked blob and then unlocks it", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);
        const blob = new Blob(name);
        let locked = await blob.lock();
        let unlocked = await blob.unlock();
        expect(locked).toStrictEqual(true);
        expect(unlocked).toStrictEqual(true);
    });

    it("Fails locking a non-existent blob", async () => {
        let name = "__mock__";
        let storage = {};
        AzureTestLibrary.Fake.useStorage(storage);
        const blob = new Blob(name);
        let locked = await blob.lock();
        let unlocked = await blob.unlock();
        expect(locked).toStrictEqual(false);
        expect(unlocked).toStrictEqual(false);
    });

    it("Fails locking an already locked blob", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);

        const blob1 = new Blob(name);
        let locked1 = await blob1.lock();

        const blob2 = new Blob(name);
        let locked2 = await blob2.lock();

        let unlocked1 = await blob1.unlock();
        let unlocked2 = await blob2.unlock();

        expect(locked1).toStrictEqual(true);
        expect(locked2).toStrictEqual(false);
        expect(unlocked1).toStrictEqual(true);
        expect(unlocked2).toStrictEqual(false);
    });

    it("Fails deleting a locked blob", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);

        const blob1 = new Blob(name);
        let locked1 = await blob1.lock();

        const blob2 = new Blob(name);
        let deleted2 = await blob2.delete();

        let unlocked1 = await blob1.unlock();

        expect(locked1).toStrictEqual(true);
        expect(unlocked1).toStrictEqual(true);
        expect(deleted2).toStrictEqual(false);
        expect(storage[name]).toBeDefined();
    });

    it("Successfully deletes a locked blob from within locked blob object", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);

        const blob = new Blob(name);
        let locked = await blob.lock();
        let deleted = await blob.delete();
        let unlocked = await blob.unlock();

        expect(locked).toStrictEqual(true);
        expect(deleted).toStrictEqual(true);
        expect(unlocked).toStrictEqual(false);
        expect(storage[name]).toBeUndefined();
    });

    it("Successfully deletes a freshly unlocked blob", async () => {
        let name = "__mock__";
        let storage = { [name]: { hello: "World" } };
        AzureTestLibrary.Fake.useStorage(storage);

        const blob1 = new Blob(name);
        let locked1 = await blob1.lock();
        let unlocked1 = await blob1.unlock();

        const blob2 = new Blob(name);
        let deleted2 = await blob2.delete();

        expect(locked1).toStrictEqual(true);
        expect(unlocked1).toStrictEqual(true);
        expect(deleted2).toStrictEqual(true);
        expect(storage[name]).toBeUndefined();
    });
});
