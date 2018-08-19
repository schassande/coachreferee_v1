import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { AppSettingsService } from './AppSettingsService';
import { ConnectedUserService } from './ConnectedUserService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { PersistentPRO } from './../model/coaching';

@Injectable()
export class PROService extends RemotePersistentDataService<PersistentPRO>{

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
        return 'pros';
    }

    getPriority(): number { 
        return 4;
    }
    public searchPros(text: string) : Observable<ResponseWithData<PersistentPRO[]>> {
        if (text) {
            let texts = text.trim().split(' ');
            return super.filter(super.all(), (pro: PersistentPRO) => {
                return texts.filter((txt) => 
                    this.stringContains(text, pro.problemShortDesc)
                    || this.stringContains(text, pro.problem)
                    || this.stringContains(text, pro.remedy)
                    || this.stringContains(text, pro.outcome)
                    ).length > 0;
            });
        } else {
            return super.all();
        }
    }
}
