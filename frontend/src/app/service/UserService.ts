import { ResponseWithData } from './response';
import { Observable } from 'rxjs/Rx';
import { LocalAppSettings } from './../model/settings';
import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { User } from './../model/user';
import { RemotePersistentDataService } from './RemotePersistentDataService';

@Injectable()
export class UserService  extends RemotePersistentDataService<User>{
    
    public currentUser: User = null;

    constructor(
        protected appSettingsService: AppSettingsService,
        protected connectedUserService:ConnectedUserService,
        protected localDatabaseService: LocalDatabaseService,
        protected synchroService: SynchroService,
        protected http: Http
    ) {
        super(appSettingsService, connectedUserService, localDatabaseService, synchroService, http);
    }

    getLocalStoragePrefix() {
        return 'user'
    }

    getPriority(): number { 
        return 1;
    }
    // Gestion des utilisateurs  
}