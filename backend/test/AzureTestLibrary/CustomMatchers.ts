import { HttpMethod } from "@azure/functions";
import { ALObjectType } from "../../src/functions/v2/ALObjectType";
import { FakeAzureFunction } from "./AzureFunction.fake";
import { ContentAnalyzer } from "./Storage.fake.types";

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeStatus(expected: number): CustomMatcherResult,
            toContainIds(type: ALObjectType, expected: number[]): CustomMatcherResult,
            toHaveConsumption(type: ALObjectType): CustomMatcherResult,
            toHaveChanged(): CustomMatcherResult,
            toBeAuthorized(): CustomMatcherResult,
            toFail(method: HttpMethod): Promise<CustomMatcherResult>,
            toFail(method: HttpMethod, expected: number): Promise<CustomMatcherResult>,
            toSucceed(method: HttpMethod): Promise<CustomMatcherResult>,
            toSucceed(method: HttpMethod, expected: number): Promise<CustomMatcherResult>,
        }
    }
}

export const initializeCustomMatchers = () => {
    expect.extend({
        toBeStatus(response: any, expected: number) {
            return {
                pass: response.status === expected,
                message: () => `Unexpected response status. Expected: ${expected}, received: ${response.status}`
            }
        },

        toContainIds(storage: ContentAnalyzer, type: ALObjectType, expected: number[]) {
            const has = storage.objectIds(type);
            let pass = has.length === expected.length;
            if (pass) {
                for (let id of has) {
                    pass = pass && expected.includes(id);
                    if (!pass) break;
                }
            }
            if (pass) {
                for (let id of expected) {
                    pass = pass && has.includes(id);
                    if (!pass) break;
                }
            }
            return {
                pass,
                message: () => `Non-matching ${type} ids. Expected: ${expected}, received: ${has}`
            }
        },

        toHaveConsumption(storage: ContentAnalyzer, type: ALObjectType) {
            const has = storage.objectIds(type) || [];
            const pass = has.length !== 0;
            return {
                pass,
                message: () => `Non-matching ${type} ids. Expected: [${pass ? "" : "...<non_empty>"}], received: ${has}`
            };
        },

        toHaveChanged(storage: ContentAnalyzer) {
            const pass = storage.hasChanged();
            return {
                pass,
                message: () => `Storage was${pass ? "" : " not"} changed. Expected:${pass ? " not" : ""} changed.`
            };
        },

        toBeAuthorized(storage: ContentAnalyzer) {
            const pass = storage.isAuthorized();
            return {
                pass,
                message: () => `App is${pass ? "" : " not"} authorized. Expected:${pass ? " not" : ""} authorized.`
            };
        },

        async toFail(azureFunction: FakeAzureFunction, method: HttpMethod, expected?: number) {
            const response = await azureFunction.invoke(method);
            const expectedStatus = typeof expected === "number" ? expected : "< 200 or > 299";
            const pass = typeof expected === "number" ? response.status === expected : response.status < 200 || response.status > 299;
            return {
                pass,
                message: () => `Function did not respond with expected status. Expected: ${expectedStatus}, received: ${response.status}`
            }
        },

        async toSucceed(azureFunction: FakeAzureFunction, method: HttpMethod, expected?: number) {
            const response = await azureFunction.invoke(method);
            const expectedStatus = typeof expected === "number" ? expected : "200..299";
            const pass = typeof expected === "number" ? response.status === expected : response.status >= 200 && response.status <= 299;
            return {
                pass,
                message: () => `Function did not respond with expected status. Expected: ${expectedStatus}, received: ${response.status}`
            }
        },

    });
};
