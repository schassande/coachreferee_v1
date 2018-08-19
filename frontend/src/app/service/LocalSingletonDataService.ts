import { Observable } from 'rxjs/Rx';
import { Storage } from '@ionic/storage';

export abstract class LocalSingletonDataService<D extends any> {
 
    private data: D;

    constructor(protected storage: Storage, protected storageName: string) {
    }

    public get(): Observable<D> {
        if (this.data) {
            return Observable.of(this.data);
        } else {
            return Observable.fromPromise(this.storage.get(this.storageName));
        }
    }

    public save(data: D): Observable<D> {
        this.data = data;
        return Observable
            .fromPromise(this.storage.set(this.storageName, data))
            .map(() => data);
    }
    public delete(): Observable<any> {
        this.data = null;
        return Observable.fromPromise(this.storage.remove(this.storageName));
    }
}