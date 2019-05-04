import { AngularFirestore } from 'angularfire2/firestore';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { SkillProfile } from './../model/skill';
import { ToastController } from '@ionic/angular';

@Injectable()
export class SkillProfileService  extends RemotePersistentDataService<SkillProfile> {

    constructor(
        db: AngularFirestore,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix() {
        return 'skillprofile';
    }

    getPriority(): number {
        return 3;
    }

}
