import { Observable } from 'rxjs/Rx';
import { Response, ResponseWithData } from './response';

export interface Crud<O> {
    get(id: number): Observable<ResponseWithData<O>>;
    save(obj: O): Observable<ResponseWithData<O>>
    all(): Observable<ResponseWithData<O[]>>;
    delete(id: number): Observable<Response>;

}