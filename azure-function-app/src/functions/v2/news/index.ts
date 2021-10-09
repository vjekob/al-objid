import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { DefaultRequest } from "../TypesV2";
import { NewsBindings, NewsResponse } from "./types";

const news = new ALNinjaRequestHandler<DefaultRequest, NewsResponse, NewsBindings>(async (request) => ({ news: request.bindings.news }), false);
news.skipAuthorization();
news.bind("news.json", "infrastructure").to("news");

export default news.azureFunction;
