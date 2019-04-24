import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { SkillProfile } from './../model/skill';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class SkillProfileService  extends RemotePersistentDataService<SkillProfile>{

    constructor(
        protected appSettingsService: AppSettingsService,
        protected connectedUserService:ConnectedUserService,
        protected localDatabaseService: LocalDatabaseService,
        protected synchroService: SynchroService,
        protected http: HttpClient
    ) {
        super(appSettingsService, connectedUserService, localDatabaseService, synchroService, http);
    }
    
    getLocalStoragePrefix() {
        return 'skillprofile'
    }

    getPriority(): number { 
        return 3;
    }

    //gestion des skill, SkillSet et SkillProfile
}