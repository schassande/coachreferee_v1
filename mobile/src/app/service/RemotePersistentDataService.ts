import { PersistentDataUpdater, PersistentDataFilter } from './PersistentDataFonctions';
import { Crud } from './crud';
import { PersistentData } from '../model/common';
import { Observable, of, from } from 'rxjs';
import { Response, ResponseWithData } from './response';
import { flatMap, map, catchError } from 'rxjs/operators';
import { AngularFirestore,
    AngularFirestoreCollection,
    DocumentReference,
    DocumentSnapshot,
    QuerySnapshot,
    QueryDocumentSnapshot,
    Query} from 'angularfire2/firestore';

export abstract class RemotePersistentDataService<D extends PersistentData> implements Crud<D> {

    private fireStoreCollection: AngularFirestoreCollection<D>;

    constructor(
        protected db: AngularFirestore
    ) {
        this.fireStoreCollection = db.collection<D>(this.getLocalStoragePrefix());
    }

    abstract getLocalStoragePrefix(): string;

    // ============================= //
    // CRUD Interface implementation //
    // ============================= //

    public get(id: string): Observable<ResponseWithData<D>> {
        console.log('DatabaseService[' + this.getLocalStoragePrefix() + '].get(' + id + ')');
        return this.fireStoreCollection.doc<D>(id).valueChanges().pipe(
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map((data: D) => {
                if (data) {
                    data.id = id;
                }
                const res = { error: null, data};
                console.log('DatabaseService[' + this.getLocalStoragePrefix() + '].get(' + id + ')=', res);
                return res;
            })
        );
    }

    public localGet(id: string): Observable<ResponseWithData<D>> {
        return this.fireStoreCollection.doc<D>(id).get({source: 'cache'}).pipe(
            map(this.docSnapToResponse)
        );
    }

    public getUrlPathOfGet(id: number) {
        return '/' + id;
    }

    public save(data: D): Observable<ResponseWithData<D>> {
        console.log('DatabaseService[' + this.getLocalStoragePrefix() + '].save(): id=' + data.id + ', status=' + data.dataStatus);
        if (data.dataStatus === 'REMOVED') {
            return of({ error : { errorCode: 1, error: null}, data });

        } else if (data.dataStatus === 'NEW') {
            data.dataStatus = 'CLEAN';
            data.creationDate = new Date();
            return this.docToObs(this.fireStoreCollection.add(data));

        } else {
            data.dataStatus = 'CLEAN';
            data.version ++;
            return this.voidToObs(this.fireStoreCollection.doc(data.id).update(data), data);
        }
    }

    private docToObs(prom: Promise<DocumentReference>): Observable<ResponseWithData<D>> {
        return from(prom).pipe(
            flatMap( (value: DocumentReference) => {
                return from(value.get());
            }),
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map(this.docSnapToResponse)
        );
    }

    private docSnapToResponse(docSnap: DocumentSnapshot<D>) {
        const data: D = docSnap.get(docSnap.id);
        if (data && !data.id) {
            // store id inside persistent object
            data.id = docSnap.id;
        }
        return { error: null, data};
    }

    private voidToObs(prom: Promise<void>, data: D): Observable<ResponseWithData<D>> {
        return from(prom).pipe(
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map(() => {
                return { error: null, data};
            })
        );
    }
    public all(): Observable<ResponseWithData<D[]>> {
        return from(this.getCollectionRef().get({ source: 'default'})).pipe(
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map(this.snapshotToObs)
        );
    }

    public getCollectionRef() {
        return this.fireStoreCollection.ref;
    }

    private snapshotToObs(qs: QuerySnapshot<D>): ResponseWithData<D[]> {
        const datas: D[] = [];
        qs.forEach((qds: QueryDocumentSnapshot<D>) => {
            const data: D = qds.data();
            if (data && !data.id) {
                // store id inside persistent object
                data.id = qds.id;
            }
            datas.push(data);
        });
        return { error: null, data: datas };
    }
    private snapshotOneToObs(qs: QuerySnapshot<D>): ResponseWithData<D> {
        const datas: D[] = [];
        qs.forEach((qds: QueryDocumentSnapshot<D>) => {
            const data: D = qds.data();
            if (data && !data.id) {
                // store id inside persistent object
                data.id = qds.id;
            }
            datas.push(data);
        });
        if (datas.length > 0) {
            return { error: null, data: datas[0] };
        } else {
            return { error: null, data: null };
        }
    }

    public query(query: Query, options: 'default' | 'server' | 'cache'): Observable<ResponseWithData<D[]>> {
        return from(query.get({ source: options})).pipe(
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map(this.snapshotToObs)
        );
    }

    public queryOne(query: Query, options: 'default' | 'server' | 'cache'): Observable<ResponseWithData<D>> {
        return from(query.limit(1).get({ source: options})).pipe(
            catchError((err) => {
                return of({ error: err, data: null});
            }),
            map(this.snapshotOneToObs)
        );
    }

    public delete(id: string): Observable<Response> {
        console.log('DatabaseService[' + this.getLocalStoragePrefix() + '].delete(' + id + ')');
        return from(this.fireStoreCollection.doc(id).delete()).pipe(
            catchError((err) => {
                return of({ error: err});
            }),
            map(() => {
                return { error: null};
            })
        );
    }

    public update(id: string, updater: PersistentDataUpdater<D>): Observable<ResponseWithData<D>> {
        console.log('DatabaseService[' + this.getLocalStoragePrefix() + '].update(' + id + ')');
        return this.get(id).pipe(
            flatMap((response: ResponseWithData<D>) => {
                if (response.error) {
                    return of(response);
                } else {
                    response.data = updater(response.data);
                    return this.save(response.data);
                }
            })
        );
    }


    protected filter(obs: Observable<ResponseWithData<D[]>>, filter: PersistentDataFilter<D>) {
        return obs.pipe(
            map((result: ResponseWithData<D[]>) => {
                if (!result.error) {
                    result.data = result.data.filter( (elem: D) => filter(elem));
                }
                return result;
            })
        );
    }

    protected stringContains(elem: string, text: string): boolean {
        return elem && text && text.toLowerCase().indexOf(elem.toLowerCase()) >= 0;
    }
}
