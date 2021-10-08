import { ALNinjaRequestHandler } from "../ALNinjaRequestHandler";
import { NewsBindings, NewsResponse } from "./types";

const news = new ALNinjaRequestHandler<any, NewsResponse, NewsBindings>(async (request) => ({ news: request.bindings.news }));
news.skipAuthorization();
news.bind("news.json", "infrastructure").to("news");

export default news.azureFunction;
