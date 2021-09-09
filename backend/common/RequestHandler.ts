import { RequestValidator } from "./RequestValidator";
import { AuthorizationContext, BodyWithAuthorization, TypedContext, TypedRequest } from "./types";

type HandlerFunc<TBindings, TBody> = (context: TypedContext<TBindings>, req: TypedRequest<TBody>) => Promise<any>;

export class ErrorResponse {
    public message: string;
    public status: number;

    constructor(message: string, status: number = 400) {
        this.message = message;
        this.status = status;
    }
}

export class RequestHandler {
    static handle<TBindings, TBody>(handler: HandlerFunc<TBindings, TBody>, validator?: RequestValidator) {
        return async (context: TypedContext<TBindings>, req: TypedRequest<TBody>) => {
            const { authorization } = (context as unknown as AuthorizationContext).bindings;
            const { authKey } = req.body as unknown as BodyWithAuthorization;
            if (authorization && authorization.valid && authorization.key != authKey) {
                return new ErrorResponse("You must provide a valid authorization key to access this endpoint.", 401);
            }

            if (validator instanceof RequestValidator && !validator.validate(req)) {
                context.res = {
                    status: 400,
                    body: validator.validationError,
                };
                return;
            }

            const result = await handler(context, req);
            if (result instanceof ErrorResponse) {
                context.res = {
                    status: result.status || 400,
                    body: result.message
                };
            } else {
                context.res = {
                    status: 200,
                    body: result
                };
            }
        }
    }
}
