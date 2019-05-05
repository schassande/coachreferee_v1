import { ConnectedUserService } from './ConnectedUserService';
import { AngularFirestore, Query } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { PersistentPRO } from './../model/coaching';
import { ToastController } from '@ionic/angular';

@Injectable()
export class PROService extends RemotePersistentDataService<PersistentPRO> {

    constructor(
        db: AngularFirestore,
        private connectedUserService: ConnectedUserService,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix() {
        return 'pro';
    }

    getPriority(): number {
        return 4;
    }

    /** Overide to restrict to the coachings of the user */
    public all(): Observable<ResponseWithData<PersistentPRO[]>> {
        return this.query(this.getBaseQueryMyAssessments(), 'default');
    }

    /** Query basis for coaching limiting access to the coachings of the user */
    private getBaseQueryMyAssessments(): Query {
        return this.getCollectionRef().where('coachId', '==', this.connectedUserService.getCurrentUser().id);
    }

    public searchPros(text: string): Observable<ResponseWithData<PersistentPRO[]>> {
        if (text) {
            const texts = text.trim().split(' ');
            return super.filter(this.all(), (pro: PersistentPRO) => {
                return texts.filter((txt) =>
                    this.stringContains(text, pro.problemShortDesc)
                    || this.stringContains(text, pro.problem)
                    || this.stringContains(text, pro.remedy)
                    || this.stringContains(text, pro.outcome)
                    ).length > 0;
            });
        } else {
            return this.all();
        }
    }
}
