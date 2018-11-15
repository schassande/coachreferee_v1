import { Observable } from 'rxjs/Rx';
import { PersistentData } from './../model/common';
export interface SyncService<D extends PersistentData> {
    getServiceId(): string;
    getPriority(): number;
    sync(datas: D[], obs:Observable<any>): Observable<any>;
}