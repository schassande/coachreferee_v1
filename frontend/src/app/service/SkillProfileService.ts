import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { SkillProfile } from './../model/skill';

@Injectable()
export class SkillProfileService  extends RemotePersistentDataService<SkillProfile>{

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
        return 'skillprofiles'
    }

    getPriority(): number { 
        return 3;
    }

    //gestion des skill, SkillSet et SkillProfile
}