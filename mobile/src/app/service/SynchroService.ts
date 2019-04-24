import { ConnectedUserService } from './ConnectedUserService';
import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { SyncService } from './SyncService';
import { PersistentData } from './../model/common';
import { Injectable, EventEmitter } from '@angular/core';
import { NetworkConnection } from '../model/settings';
// import { Network } from '@ionic-native/network';
import { Observable, of, from, empty } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';


/**
 * This service permits to store data to synchronize later.
 *
 * @Author: S.Chassande
 */
@Injectable()
export class SynchroService {

    /**
     * Map associating a sync service identifier to the persistent data to synchronize and its sync service to use.
     * key : sync service id.
     */
    private persistentDatasToSynchronize: Map<string, PersistentDatasToSynchronize<any>>
        = new Map<string, PersistentDatasToSynchronize<any>>();


    private synchronizing = false;
    private syncEvent: EventEmitter<SyncEvent> = new EventEmitter<SyncEvent>();
    private connected = false;

    constructor(
        // private network: Network,
        private appSettingsService: AppSettingsService,
        private connectedUserService: ConnectedUserService) {
            /*
        this.network.onConnect().subscribe(() => {
            this.connected = true;
            console.log('SyncrhoService: Network connected!');
            this.tryToSynchronize().subscribe(); // try to synchronize local database with the remote server
        });
        this.network.onDisconnect().subscribe(() => {
            this.connected = false;
            console.log('SyncrhoService: Network Disconnected!');
        });
            */
        this.connectedUserService.$userConnectionEvent.subscribe(() => {
            if (this.connectedUserService.isConnected()) {
                this.tryToSynchronize().subscribe(); // try to synchronize local database with the remote server
            }
        });
    }


    /**
     * Store/Remind a persistent data to synchronize later.
     * @param data is the persistent data to synchronize later.
     * @param syncService is the service to use to synchronize the persistent data.
     */
    public forget<D extends PersistentData>(data: D, syncService: SyncService<D>): Observable<D> {
        let obs: Observable<D>;
        if (this.synchronizing) {
            // Wait the end of the synchronisation
            obs = this.syncEvent.asObservable().pipe(flatMap(() => of(data)));
        } else {
            obs = of(data);
        }
        return obs.pipe(
            map((data2: D) => {
                const pdts: PersistentDatasToSynchronize<D> = this.persistentDatasToSynchronize.get(syncService.getServiceId());
                if (pdts === null) {
                    return null;
                }
                const idx = pdts.datas.findIndex((d) => data2.id === d.id);
                if (idx < 0) {
                    return null;
                } else {
                    // update the modified persistent data
                    pdts.datas = pdts.datas.slice(idx, 1);
                    return data2;
                }
            })
        );
    }
    /**
     * Store/Remind a persistent data to synchronize later.
     * @param data is the persistent data to synchronize later.
     * @param syncService is the service to use to synchronize the persistent data.
     */
    public remind<D extends PersistentData>(data: D, syncService: SyncService<D>): Observable<D> {
        let obs: Observable<D>;
        if (this.synchronizing) {
            // Wait the end of the synchronisation
            obs = this.syncEvent.asObservable().pipe(flatMap(() => of(data)));
        } else {
            obs = of(data);
        }
        return obs.pipe(
            map((data2: D) => {
                let pdts: PersistentDatasToSynchronize<D> = this.persistentDatasToSynchronize.get(syncService.getServiceId());
                if (!pdts) {
                    pdts = { syncService: syncService, datas: [] };
                    this.persistentDatasToSynchronize.set(syncService.getServiceId(), pdts);
                }
                // console.log('SynchroService.remind(' + data.id + '): pdts=' + JSON.stringify(pdts));
                const idx = pdts.datas.findIndex((d) => data2.id === d.id);
                if (idx < 0) {
                    // add new persistent data
                    pdts.datas.push(data2);
                } else {
                    // update the modified persistent data
                    pdts.datas[idx] = data2;
                }
                return data2;
            })
        );
    }

    /**
     * Computes if the application is online and then allowed to perform online calls to servers.
     */
    public isOnline(): Observable<boolean> {
        return this.appSettingsService.get().pipe(
            flatMap( (localAppSettings: LocalAppSettings) => {
                if (!localAppSettings.minNetworkConnectionForSyncho || localAppSettings.minNetworkConnectionForSyncho === 'NONE') {
                    // always offline
                    return of(false);
                } else {
                    // check the current network connection
                    return this.getNetworkConnection().pipe(
                        map((networkConnection: NetworkConnection) => {
                            const orderedNetworkConnection: NetworkConnection[] = ['NONE', 'UNKNOWN', '3G', '4G', 'WIFI', 'WIRED'];
                            const ncIdx = orderedNetworkConnection.indexOf(networkConnection);
                            const minNcIdx = orderedNetworkConnection.indexOf(localAppSettings.minNetworkConnectionForSyncho);
                            const online = ncIdx >= 1 && ncIdx >= minNcIdx;
                            console.log('SynchroService.isOnline(): networkConnection=' + networkConnection + ' => online=' + online);
                            return online;
                        })
                    );
                }
            })
        );
    }

    /**
     * @return a boolean value indicating if there is data to synchronize.
     */
    public hasDataToSynchronize(serviceId: string= null): boolean {
        let hasDataToSynchronize = false;
        this.persistentDatasToSynchronize.forEach( (pdts: PersistentDatasToSynchronize<any>) => {
            hasDataToSynchronize = hasDataToSynchronize
                || ((serviceId == null || serviceId === pdts.syncService.getServiceId()) && pdts.datas.length > 0 );
        });
        return hasDataToSynchronize;
    }

    /**
     * Launches the data synchronisation.
     */
    public synchronize<D extends PersistentData>(serviceId: string= null): Observable<any> {
        if (this.synchronizing) {
            return from(this.syncEvent);
        }
        const event: SyncEvent = { total: 0, synchronized: 0, elements: [] };
        this.synchronizing = true;
        // Step 1 : transform Map to array
        let pdtss: PersistentDatasToSynchronize<D>[] = [];

        this.persistentDatasToSynchronize.forEach((pdts: PersistentDatasToSynchronize<D>) => {
            if (serviceId == null || serviceId === pdts.syncService.getServiceId()) {
                pdtss.push(pdts);
            }
        });
        // Forget data to sync
        this.persistentDatasToSynchronize.clear();

        console.log('SynchroService.synchronize(): ' + pdtss.length + ' data to synchronize');
        // Step 2 : sort the array by priority
        pdtss = pdtss.sort((pdts1: PersistentDatasToSynchronize<D>, pdts2: PersistentDatasToSynchronize<D>) =>
            pdts1.syncService.getPriority() - pdts2.syncService.getPriority());

        // Step 3: chain/concat observable
        let obs: Observable<any> = of('');
        pdtss.forEach((pdts) => {
            pdts.syncService.getServiceId();
            obs = pdts.syncService.sync(pdts.datas, obs);
        });

        return obs.pipe(
            map(value => {
                console.log('SynchroService.synchronize(): end of synchronization ' + value);
                this.syncEvent.emit(event);
                this.synchronizing = false;
                return value;
            })
        );
    }

    public tryToSynchronize(loginRequired: boolean = true, serviceId: string= null): Observable<any> {
        if (this.synchronizing) {
            console.log('SynchroService.tryToSynchronize: Already synchronising.');
            return of('');
        } else if (loginRequired && !this.connectedUserService.isLogin()) {
            console.log('SynchroService.tryToSynchronize: User is not login.');
            return of('');
        } else if (!this.hasDataToSynchronize(serviceId)) {
            console.log('SynchroService.tryToSynchronize: No data to synchronize.');
            return of('');
        } else {
            console.log('SynchroService.tryToSynchronize: There is data to synchronize.');
            return this.isOnline().pipe(
                flatMap((online) => {
                    if (!online) {
                        console.log('SynchroService.tryToSynchronize: There is data to synchronize BUT not enough network.');
                    }
                    return online ? this.synchronize(serviceId) : of('');
                })
            );
        }
    }
    public trySynchronizeWithoutLogin(serviceId: string) {
        if (this.synchronizing) {
            console.log('Already synchronising.');
            return empty();
        } else if (!this.hasDataToSynchronize()) {
            console.log('No data to synchronize.');
            return empty();
        } else {
            console.log('There is data to synchronize.');
            return this.isOnline().pipe(
                flatMap((online) => {
                    if (!online) {
                        console.log('There is data to synchronize BUT not enough network.');
                    }
                    return online ? this.synchronize() : empty();
                })
            );
        }
    }
    /**
     * @return an observable indicating the network connection status.
     */
    private getNetworkConnection(): Observable<NetworkConnection> {
        const  nc: NetworkConnection = 'UNKNOWN';
        /*
        switch (this.network.type) {
            case 'ethernet':
                nc = 'WIRED';
                break;
            case 'wifi':
                nc = 'WIFI';
                break;
            case '3g':
                nc = '3G';
                break;
            case '4g':
                nc = '4G';
                break;
        }
        */
        // console.log('Network type =' + JSON.stringify(this.network.type) + ' => ' + nc);
        return of(nc);
    }
}
/**
 * Internal type defintion for storing data to synchronize.
 */
interface PersistentDatasToSynchronize<D extends PersistentData> {
    /** The Sync service to use to synchronize the persistent data. */
    syncService: SyncService<D>;
    /** The persistent data to synchronize. */
    datas: D[];
}

interface SyncEvent {
    total: number;
    synchronized: number;
    elements: SyncElement[];
}

interface SyncElement {
    service: string;
    size: number;
    synchronized: number;
}


