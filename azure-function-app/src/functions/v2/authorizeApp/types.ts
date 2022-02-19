export interface AuthorizeAppResponse {
    authorized?: boolean;
    authKey?: string;
    deleted?: boolean;
    user?: {
        name: string; // This is always encrypted
        email: string; // This is always encrypted
        timestamp: number;
    }
}

export interface AuthorizeAppRequest {
    gitUser: string; // This is encrypted!
    gitEMail: string; // This is always sent encrypted!
}
