import { User } from './../model/user';
import { Observable } from 'rxjs/Rx';
import { LocalAppSettings } from './../model/settings';
import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import { LocalSingletonDataService } from './LocalSingletonDataService';

@Injectable()
export class AppSettingsService extends LocalSingletonDataService<LocalAppSettings> {
 
    constructor(storage: Storage) {
        super(storage, 'LocalAppSettings');
    }

    public get(): Observable<LocalAppSettings> {
        return super.get()
            .map((las: LocalAppSettings) => {
                let result: LocalAppSettings = las;
                if (!result) {
                    result = {
                        serverUrl: '',
                        minNetworkConnectionForSyncho: 'NONE',
                        lastUserId: 0
                    }
                    super.save(result);
                }
                return result;
            });
    }

    public setLastUser(user: User) {
        this.get().subscribe((setting: LocalAppSettings) => {
            setting.lastUserId = user.id;
            this.save(setting).subscribe();
        });
    }
}