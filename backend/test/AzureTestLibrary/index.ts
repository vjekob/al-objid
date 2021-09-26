import * as _fakeStorage from "./Storage.fake";
import * as _fakeFunction from "./AzureFunction.fake";
import * as _stubStorage from "./Storage.stub";

import { initializeCustomMatchers } from "./CustomMatchers";

initializeCustomMatchers()

export namespace AzureTestLibrary {

    export namespace Fake {

        export import useStorage = _fakeStorage.useStorage;
        export import AzureFunction = _fakeFunction.FakeAzureFunction;

    }

    export namespace Stub {

        export import authenticatedApp = _stubStorage.authenticatedApp;
        export import appId = _stubStorage.appId;
        export import authKey = _stubStorage.authKey;
        export import storage = _stubStorage.buildStorage;
        export import app = _stubStorage.buildApp;
                
    }

}
