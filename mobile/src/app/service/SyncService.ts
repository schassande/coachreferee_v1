import { PersistentData } from './../model/common';
import { Observable } from 'rxjs';
export interface SyncService<D extends PersistentData> {
    getServiceId(): string;
    getPriority(): number;
    sync(datas: D[], obs:Observable<any>): Observable<any>;
}