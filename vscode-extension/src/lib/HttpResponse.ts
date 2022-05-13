export interface HttpResponse<T> {
    error: any;
    status: symbol;
    value?: T;
}
