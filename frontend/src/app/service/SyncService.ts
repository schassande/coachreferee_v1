import { ResponseWithData } from './response';
import { Observable } from 'rxjs/Rx';
import { PersistentData } from './../model/common';
export interface SyncService<D extends PersistentData> {
    getServiceId(): string;
    getPriority(): number;
    sync(datas: D[]): Observable<ResponseWithData<D>[]>;
}