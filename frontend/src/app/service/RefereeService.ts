import { Observable } from 'rxjs/Rx';
import { ResponseWithData } from './response';
import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Referee } from './../model/user';

@Injectable()
export class RefereeService extends RemotePersistentDataService<Referee>{

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
        return 'referees'
    }

    getPriority(): number { 
        return 2;
    }

    public searchReferees(text: string) : Observable<ResponseWithData<Referee[]>> {
        if (text) {
            return super.filter(super.all(), (referee: Referee) => {
                return this.stringContains(text, referee.shortName)
                    || this.stringContains(text, referee.firstName)
                    || this.stringContains(text, referee.lastName)
            });
        } else {
            return super.all();
        }
    }   
}