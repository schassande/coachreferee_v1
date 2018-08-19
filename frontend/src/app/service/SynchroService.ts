import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { SyncService } from './SyncService';
import { PersistentData } from './../model/common';
import { Observable } from 'rxjs/Rx';
import { Injectable, EventEmitter } from '@angular/core';
import { NetworkConnection } from '../model/settings'
import { Network } from '@ionic-native/network';


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
    private persistentDatasToSynchronize: Map<string,PersistentDatasToSynchronize<any>> = new Map<string,PersistentDatasToSynchronize<any>>();

    private synchronizing = false;
    private syncEvent: EventEmitter<number> = new EventEmitter<number>();

    constructor(
        private network: Network, 
        private appSettingsService: AppSettingsService) {

        this.network.onConnect().subscribe(() => { console.log('network connected!'); });
        this.network.onDisconnect().subscribe(() => { console.log('network Disconnected!'); });
    }


    /**
     * Store/Remind a persistent data to synchronize later.
     * @param data is the persistent data to synchronize later.
     * @param syncService is the service to use to synchronize the persistent data.
     */
    public forget<D extends PersistentData>(data: D, syncService: SyncService<D>): boolean {
        if (this.synchronizing) {
            return false;
        }
        let pdts:PersistentDatasToSynchronize<D> = this.persistentDatasToSynchronize.get(syncService.getServiceId())
        if (pdts === null) {
            return true;
        }
        const idx = pdts.datas.findIndex((d) => data.id === d.id);
        if (idx < 0) {
            return false;
        } else {
            // update the modified persistent data
            pdts.datas = pdts.datas.slice(idx, 1);
        }
    }
        /**
     * Store/Remind a persistent data to synchronize later.
     * @param data is the persistent data to synchronize later.
     * @param syncService is the service to use to synchronize the persistent data.
     */
    public remind<D extends PersistentData>(data: D, syncService: SyncService<D>): boolean {
        if (this.synchronizing) {
            return false;
        }
        let pdts:PersistentDatasToSynchronize<D> = this.persistentDatasToSynchronize.get(syncService.getServiceId())
        if (!pdts) {
            pdts = { syncService: syncService, datas: [] }
            this.persistentDatasToSynchronize.set(syncService.getServiceId(), pdts);
        }
        //console.log('SynchroService.remind(' + data.id + '): pdts=' + JSON.stringify(pdts));
        const idx = pdts.datas.findIndex((d) => data.id === d.id);
        if (idx < 0) {
            // add new persistent data
            pdts.datas.push(data);
        } else {
            // update the modified persistent data
            pdts.datas[idx] = data;
        }
    }

    /**
     * Computes if the application is online and then allowed to perform online calls to servers.
     */
    public isOnline(): Observable<boolean> {
        return this.appSettingsService.get().flatMap( (localAppSettings: LocalAppSettings) => {
            return Observable.of(false);
            /*
            //console.log('SynchroService.isOnline(): localAppSettings.minNetworkConnectionForSyncho=' + localAppSettings.minNetworkConnectionForSyncho);
            if (localAppSettings.minNetworkConnectionForSyncho === 'NONE') {
                // always offline 
                //console.log('SynchroService.isOnline(): =>FALSE');
                return Observable.of(false);
            } else {
                // check the current network connection
                return this.getNetworkConnection().map((networkConnection:NetworkConnection) => {
                    //console.log('SynchroService.isOnline(): networkConnection=' + networkConnection);
                    const orderedNetworkConnection: NetworkConnection[] = ['UNKNOWN', 'NONE', '3G', '4G', 'WIFI', 'WIRED'];
                    const ncIdx = orderedNetworkConnection.indexOf(networkConnection);
                    const minNcIdx = orderedNetworkConnection.indexOf(localAppSettings.minNetworkConnectionForSyncho);
                    const online = ncIdx >= 2 && ncIdx >= minNcIdx;
                    //console.log('SynchroService.isOnline(): =>' + online);
                    return online;
                });
            }
            */
        });
    }

    /**
     * @return a boolean value indicating if there is data to synchronize.
     */
    public hasDataToSynchronize(): boolean {
        let hasDataToSynchronize: boolean = false;
        this.persistentDatasToSynchronize.forEach( (pdts:PersistentDatasToSynchronize<any>) => { 
            hasDataToSynchronize = hasDataToSynchronize || pdts.datas.length > 0;
        });
        return hasDataToSynchronize;
    }

    /**
     * Launches the data synchronisation.
     */
    public synchroize<D extends PersistentData>(): Observable<any> {
        if (this.synchronizing) {
            return Observable.from(this.syncEvent);
        }
        this.synchronizing = true;
        let pdtss: PersistentDatasToSynchronize<D>[] = [];
        this.persistentDatasToSynchronize.forEach((pdts:PersistentDatasToSynchronize<D>) => {
            pdtss.push(pdts);
        });
        pdtss = pdtss.sort((pdts1: PersistentDatasToSynchronize<D>, pdts2: PersistentDatasToSynchronize<D>) => 
            pdts1.syncService.getPriority() - pdts2.syncService.getPriority());
        let obs: Observable<any>[] = [];
        pdtss.forEach((pdts) => {
            obs.push(pdts.syncService.sync(pdts.datas));
        });
        return Observable.concat(obs).do(value => {         
            this.syncEvent.emit(0);
            this.synchronizing = false;
            return value;
        });
    }

    /**
     * @return an observable indicating the network connection status.
     */
    private getNetworkConnection(): Observable<NetworkConnection> {
        let  nc: NetworkConnection = 'UNKNOWN';
        switch(this.network.type) {
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
        //console.log('Network type =' + JSON.stringify(this.network.type) + ' => ' + nc);
        return Observable.of(nc);
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
