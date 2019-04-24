import { User } from './../model/user';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocalAppSettings, NetworkConnection } from './../model/settings';
import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { LocalSingletonDataService } from './LocalSingletonDataService';

@Injectable()
export class AppSettingsService extends LocalSingletonDataService<LocalAppSettings> {
 
    constructor(storage: Storage) {
        super(storage, 'LocalAppSettings');
    }

    public get(): Observable<LocalAppSettings> {
        return super.get().pipe(
            map((las: LocalAppSettings) => {
                let result: LocalAppSettings = las;
                if (!result) {
                    result = {
                        serverUrl: ' https://1eyhctd9mb.execute-api.eu-west-1.amazonaws.com/dev',
                        minNetworkConnectionForSyncho: 'NONE',
                        lastUserId: 0
                    }
                    super.save(result);
                }
                return result;
            })
        );
    }

    public setLastUser(user: User) {
        this.get().subscribe((setting: LocalAppSettings) => {
            setting.lastUserId = user.id;
            this.save(setting).subscribe();
        });
    }
    public setMinNetworkConnectionForSyncho(minNetworkConnectionForSyncho:NetworkConnection) {
        this.get().subscribe((setting: LocalAppSettings) => {
            setting.minNetworkConnectionForSyncho = minNetworkConnectionForSyncho;
            this.save(setting).subscribe();
        });
    }
    public setServerUrl(serverUrl:string) {
        this.get().subscribe((setting: LocalAppSettings) => {
            setting.serverUrl = serverUrl;
            this.save(setting).subscribe();
        });
    }
    public setApplicationVersion(applicationVersion:string) {
        this.get().subscribe((setting: LocalAppSettings) => {
            setting.applicationVersion = applicationVersion;
            this.save(setting).subscribe();
        });
    }
}