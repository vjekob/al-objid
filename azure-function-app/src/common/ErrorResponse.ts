export class ErrorResponse {
    public message: string;
    public status: number;
    public headers: { [key: string]: string };

    constructor(message: string, status: number = 400, headers?: { [key: string]: string }) {
        this.message = message;
        this.status = status;
        this.headers = headers;
    }
}
