export interface AuthorizedAppResponse {
    authorized: boolean;
    valid: boolean;
    user: {
        name: string;
        email: string;
        timestamp: number;
    };
}
