import https = require("https");

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type Request = {
    method?: HttpMethod;
    hostname: string;
    port?: number;
    path: string;
    headers: { [key: string]: any };
};

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

export class Https {
    private options: Request;
    constructor(request: Request) {
        this.options = request;
        if (!this.options.headers) this.options.headers = DEFAULT_HEADERS;
    }

    accept(type: string) {
        this.options.headers.Accept = type;
    }

    send<T>(method: HttpMethod, data: any) {
        return new Promise<T>((fulfill, reject) => {
            this.options.method = method;
            const serialized = JSON.stringify(data);
            this.options.headers["Content-Length"] = Buffer.byteLength(serialized);

            var req = https.request(this.options, (res: any) => {
                res.setEncoding("utf8");

                var body = "";
                res.on("data", (chunk: any) => (body += chunk));
                res.on("end", () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject({
                                error: body,
                                statusCode: res.statusCode,
                                headers: res.headers,
                            });
                            return;
                        }

                        if (!body) {
                            fulfill(undefined as unknown as T);
                            return;
                        }

                        fulfill(JSON.parse(body) as T);
                    } catch (e) {
                        console.log(`${JSON.stringify(this.options)} - ${serialized}: ${e}`);
                        reject(e);
                    }
                });
                res.on("error", (e: any) => {
                    reject({
                        error: e,
                    });
                });
            });

            req.on("error", (e: any) => {
                reject({
                    error: e,
                });
            });

            req.write(serialized);
            req.end();
        });
    }
}
