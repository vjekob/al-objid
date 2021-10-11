import { RequestHandler } from "@vjeko.com/azure-func";
import AppCache from "../src/AppCache";

const showCache = new RequestHandler(async () => AppCache.getCachedIds());

export default showCache.azureFunction;
