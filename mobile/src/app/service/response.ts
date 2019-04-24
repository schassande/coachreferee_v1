export interface Response {
    error: {
        errorCode: number;
        error: any;
    };
}
export interface ResponseWithData<D> extends Response {
    data: D;
}
