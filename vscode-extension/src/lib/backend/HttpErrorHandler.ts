import { HttpRequest } from "./HttpRequest";
import { HttpResponse } from "./HttpResponse";

export type HttpErrorHandler<T> = (response: HttpResponse<T>, request: HttpRequest) => Promise<boolean>;
