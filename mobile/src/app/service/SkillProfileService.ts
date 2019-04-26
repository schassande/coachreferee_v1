import { AngularFirestore } from 'angularfire2/firestore';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { SkillProfile } from './../model/skill';

@Injectable()
export class SkillProfileService  extends RemotePersistentDataService<SkillProfile> {

    constructor(
        db: AngularFirestore,
    ) {
        super(db);
    }

    getLocalStoragePrefix() {
        return 'skillprofile';
    }

    getPriority(): number {
        return 3;
    }

    // gestion des skill, SkillSet et SkillProfile
}
