export class ErrorResponse {
    public message: string;
    public status: number;

    constructor(message: string, status: number = 400) {
        this.message = message;
        this.status = status;
    }
}
