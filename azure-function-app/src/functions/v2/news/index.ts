import { AzureFunctionRequestHandler } from "../RequestHandler";
import { NewsBindings, NewsResponse } from "./types";

const news = new AzureFunctionRequestHandler<any, NewsResponse, NewsBindings>(async (_, bindings) => bindings);
news.skipAuthorizationCheck();
news.bind("news.json", "infrastructure").to("news");

export default news.azureFunction;
