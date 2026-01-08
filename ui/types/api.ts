export interface ApiResponse<T = any> {
    status: 'success' | 'fail' | 'error';
    message: string;
    data: T;
}

export interface ApiErrorResponse {
    status: 'fail' | 'error';
    message: string;
    stack?: string;
}

export class ApiError extends Error {
    public status: 'fail' | 'error';
    public statusCode?: number;

    constructor(message: string, status: 'fail' | 'error' = 'fail', statusCode?: number) {
        super(message);
        this.status = status;
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
