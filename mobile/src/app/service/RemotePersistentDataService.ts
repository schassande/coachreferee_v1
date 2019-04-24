import { PersistentDataUpdater, PersistentDataFilter } from './PersistentDataFonctions';
import { LocalDatabaseService, ModifiableData } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { LocalAppSettings } from '../model/settings';
import { SynchroService } from './SynchroService';
import { SyncService } from './SyncService';
import { Crud } from './crud';
import { PersistentData } from '../model/common';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Response, ResponseWithData } from './response';
import { flatMap, map, catchError } from 'rxjs/operators';

export abstract class RemotePersistentDataService<D extends PersistentData> implements Crud<D>, SyncService<D> {
    
    abstract getLocalStoragePrefix(): string;

    constructor(
        protected appSettingsService: AppSettingsService,
        protected connectedUserService:ConnectedUserService,
        protected localDatabaseService: LocalDatabaseService,
        protected synchroService: SynchroService,
        protected http: HttpClient
    ) {
        this.loadModifiedData();
    }

    public getResourceUrlPath(): string {
        return '/' + this.getLocalStoragePrefix();
    }
    
    private loadModifiedData() {
        this.localAll().subscribe((response:ResponseWithData<D[]>) => {
            if (response.data) {
                response.data.forEach((data:D) => {
                    if (data.dataStatus != 'CLEAN') {
                        //console.log('RemotePersistentDataService[' + this.getServiceId() + "].loadModifiedData(): remind " + data.id);
                        this.synchroService.remind(data, this).subscribe(); 
                    }
                });
            }
        });
    }

    // ============================= //
    // CRUD Interface implementation //
    // ============================= //

    public get(id: number): Observable<ResponseWithData<D>> {
        if (!id) {
            return of({data: null, error: null});
        }
        return this.syncIfOnline().pipe(
            flatMap((online:boolean) => {
                return online ? this.remoteGet(id) : this.localGet(id);
            }));
    }
    public localGet(id: number, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + "].localGet(" + id + ")");
        return obs.pipe(
            flatMap(() => this.localDatabaseService.get<D>(this.getLocalStoragePrefix(), id)),
            map( (data:D) => ({ data: data, error: null})),
            catchError(err => { return of( { data: null, error: err} ) })
            );
    }
    protected remoteGet(id: number, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + "].remoteGet(" + id + ")");
        return this.remoteAfterHttp(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap((localAppSettings: LocalAppSettings) => {
                return this.http.get<D>(
                    `${localAppSettings.serverUrl}${this.getResourceUrlPath()}${this.getUrlPathOfGet(id)}`, 
                    this.connectedUserService.getRequestOptions(localAppSettings))
                })
        ));
    }

    public getUrlPathOfGet(id: number) {
        return '/' + id;
    }

    public clear(): Observable<Response> {
        return this.localDatabaseService.clear(this.getLocalStoragePrefix());
    }

    public save(data: D): Observable<ResponseWithData<D>> {
        if (data.dataStatus === 'REMOVED') {
            return of({ error : { errorCode: 1, error: null}, data:data });
        }
        if (data.dataStatus === 'CLEAN') {
            data.version ++;
        }
        if (data.id === 0) {
            data.id = new Date().getTime();
            data.creationDate = new Date();
            data.dataStatus = 'NEW';
        } else {
            if (data.id !== -1) {
                data.dataStatus = 'DIRTY';
            }
        }
        return this.syncIfOnline().pipe(
            flatMap((online:boolean) => {
                return online ? this.remoteSave(data) : this.localSave(data);
            }));
    }
    
    private remoteSave(data: D, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + "].remoteSave(" + data.id + ")");
        return this.remoteAfterHttp(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap((localAppSettings: LocalAppSettings) => {
                return this.http.post<D>(
                        `${localAppSettings.serverUrl}${this.getResourceUrlPath()}`, data,
                        this.connectedUserService.getRequestOptions(localAppSettings));
            })
        ));
    }
    private localSave(data: D, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + "].localSave(" + data.id + ")");
        return obs.pipe(
            flatMap(() => { 
                if (data.dataStatus === 'CLEAN') {
                    // console.log('1-RemotePersistentDataService' + this.getServiceId() + ".localSave(" + JSON.stringify(data) + ") CLEAN");
                    return of(data);
                } else {
                    // console.log('1-RemotePersistentDataService' + this.getServiceId() + ".localSave(" + JSON.stringify(data) + ")");
                    return this.synchroService.remind(data, this);
                }
            }),
            flatMap(() => {
                // console.log('2-RemotePersistentDataService' + this.getServiceId() + ".localSave(" + JSON.stringify(data) + ")");
                return this.localDatabaseService.set<D>(this.getLocalStoragePrefix(), data);
            }),
            map( (data: D) => ({ data: data, error: null})),
            catchError(err => of( { data: null, error: err} ))
        );
    }

    public all(): Observable<ResponseWithData<D[]>> {
        return this.syncIfOnline().pipe(
            flatMap((online: boolean) => {
                return this.localAll().pipe(
                    flatMap( (res: ResponseWithData<D[]>) => {
                        if (online) {
                            return this.remoteAll().pipe(
                                map((resRemote: ResponseWithData<D[]>) => {
                                    return this.mergeLocalNRemote(res, resRemote);
                                }));
                        } else {
                            return of(res);
                        }
                    }));
        }));
    }
    private mergeLocalNRemote(res: ResponseWithData<D[]>, resRemote: ResponseWithData<D[]>): ResponseWithData<D[]> {
        if (resRemote.data) {
            // retain remote data wich are not already in local
            res.data = res.data.concat(
                resRemote.data
                    .filter((remoteData) => remoteData && res.data.filter(
                        (localData) => localData && remoteData && localData.id === remoteData.id).length === 0)
            );
        }
        return res;
    }
    private remoteAll(obs: Observable<any> = of('')): Observable<ResponseWithData<D[]>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteAll()');
        return this.remoteAfterHttpMulti(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap((localAppSettings: LocalAppSettings) => {
                return this.http.get<D>(`${localAppSettings.serverUrl}${this.getResourceUrlPath()}`,
                    this.connectedUserService.getRequestOptions(localAppSettings)).pipe(
                        map( (response: any) => {
                        console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteAll() response=' + JSON.stringify(response));
                        return response;
                    }));
            })));
    }
    public localAll(obs: Observable<any> = of('')): Observable<ResponseWithData<D[]>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + '].localAll()');
        return obs.pipe(
            flatMap(() => this.localDatabaseService.getModifiableData<D>(this.getLocalStoragePrefix())),
            map( (md: ModifiableData<D>) => {
                let datas: D[] = [];
                if (md) {
                    // concat modified and unmodified element
                    datas = Array.from(md.modified.values()).concat(Array.from(md.unmodified.values()));
                }
                // console.log('localAll() => ' + JSON.stringify(datas));
                return { data: datas, error: null} ;
            }),
            catchError(err => of( { data: null, error: err} ))
        );
    }


    public delete(id: number): Observable<Response> {
        return this.syncIfOnline().pipe(
            flatMap((online: boolean) => {
                return online ? this.remoteDelete(id) : this.localDelete(id);
            })
        );
    }
    private remoteDelete(id: number, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteDelete(' + id + ')');
        return this.remoteAfterHttp(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap( (localAppSettings: LocalAppSettings) => {
                return this.http.delete<D>(`${localAppSettings.serverUrl}${this.getResourceUrlPath()}/${id}`,
                    this.connectedUserService.getRequestOptions(localAppSettings));
            }))
        );
    }
    private localDelete(id: number, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        // console.log('RemotePersistentDataService[' + this.getServiceId() + "].localDelete(" + id + ")");
        return obs.pipe(
            flatMap(() => this.localDatabaseService.get<D>(this.getLocalStoragePrefix(), id)),
            flatMap((data: D) => {
                // console.log('RemotePersistentDataService[' + this.getServiceId() + "].localDelete(" + id + ") data.dataStatus=" + data.dataStatus);
                if (data === null || !data) {
                    // nothing to do

                } else if (data.dataStatus === 'NEW') {
                    data.dataStatus = 'REMOVED';
                    data.lastUpdate = new Date();

                    // Remove from the local storage
                    return this.localDatabaseService.remove(this.getLocalStoragePrefix(), data).pipe(
                        map((d: D) => ({ data: d, error: null}))
                    );

                } else if (data.dataStatus === 'DIRTY' || data.dataStatus === 'CLEAN') {
                    data.dataStatus = 'REMOVED';
                    data.lastUpdate = new Date();

                    // Remind in synchro service that element is removed
                    return this.synchroService.remind(data, this).pipe(
                        flatMap(() => {
                            // mark element as deleted in local storage
                            return this.localDatabaseService.markAsDeleted(this.getLocalStoragePrefix(), data).pipe(
                                map((d: D) => ({ data: data, error: null}))
                            );
                        })
                    );
                }
                return of({ data: data, error: null});
            })
        );
    }
    private localClean(id: number, obs: Observable<any> = of('')): Observable<ResponseWithData<D>> {
        return obs.pipe(
            flatMap(() => this.localDatabaseService.get<D>(this.getLocalStoragePrefix(), id)),
            flatMap( (data: D) => {
                return this.localDatabaseService.remove(this.getLocalStoragePrefix(), data).pipe(
                    map(d => ({ data: d, error: null}))
                );
            })
        );
    }


    public update(id: number, updater: PersistentDataUpdater<D>): Observable<ResponseWithData<D>> {
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

    // ==================================== //
    // SyncService Interface implementation //
    // ==================================== //
    public getServiceId(): string {
        return this.getLocalStoragePrefix();
    }
    public abstract getPriority(): number;

    public sync(datas: D[], obs: Observable<any>= of('')): Observable<any> {
        datas.map(data => {
            if (data.dataStatus === 'NEW' || data.dataStatus === 'DIRTY') {
                obs = this.remoteSave(data, obs).pipe(
                    flatMap((response: ResponseWithData<D>) => {
                        console.log('Sync: After remoteSave ' + this.getLocalStoragePrefix() + '(' + data.id + '): response=' + JSON.stringify(response));
                        if (response.error && response.error.error) {
                            return of(response);
                        } else {
                            return this.localSave(this.adjustBeforeSyncBack(response.data, data));
                        }
                    })
                );

            } else if (data.dataStatus === 'REMOVED') {
                obs = this.remoteDelete(data.id, obs).pipe(
                    flatMap((response: ResponseWithData<D>) => {
                        return this.localClean(response.data.id);
                    })
                );
            }
        });
        return obs;
    }

    protected adjustBeforeSyncBack(dataNew: D, dataOld: D) {
        return dataNew;
    }

    // =============== //
    // Private methods //
    // =============== //

    protected syncIfOnline(): Observable<boolean> {
        return this.synchroService.isOnline().pipe(
            flatMap((online: boolean) => {
                if (online && this.synchroService.hasDataToSynchronize()) {
                    console.log('RemotePersistentDataService[' + this.getServiceId() + '].syncIfOnline(): Online && There is data to synchronize.');
                    // Online && there is data to synchronize before to get data
                    return this.synchroService.synchronize().pipe(flatMap(() => of(online)));
                } else {
                    // console.log('RemotePersistentDataService[' + this.getServiceId() + "].syncIfOnline(): No synchronization (online=" + online + ").");
                    return of(online);
                }
            })
        );
    }

    protected remoteAfterHttp(obs: Observable<D>): Observable<ResponseWithData<D>> {
        return obs.pipe(
            map(res => {
                // console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteAfterHttp()\n\tHttp response= ' + JSON.stringify(json, null, 2));
                return { data: res, error: { errorCode: null, error: null}};
            }),
            catchError(err => {
                console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteAfterHttp()\n\tHttp Err= ' + JSON.stringify(err, null, 2));
                return of({data: null, error : { error: err, errorCode: err.status}});
            })
        );
    }
    protected remoteAfterHttpMulti(obs: Observable<D[]>): Observable<ResponseWithData<D[]>> {
        // console.log('RemotePersistentDataService[' + this.getServiceId() + "].remoteAfterHttpMulti()");
        return obs.pipe(
            map(res => {
                // console.log('\tHttp response= ' + JSON.stringify(json, null, 2));
                return { data: res, error: { errorCode: null, error: null}};
            }),
            catchError(err => {
                console.log('RemotePersistentDataService[' + this.getServiceId() + '].remoteAfterHttpMulti()\tHttp Err= ' + JSON.stringify(err, null, 2));
                return of({data: null, error : { error: err, errorCode: err.status}});
            })
        );
    }
}
