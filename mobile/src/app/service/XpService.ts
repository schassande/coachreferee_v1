import { ConnectedUserService } from './ConnectedUserService';
import { AngularFirestore, Query } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Xp } from '../model/xphistory';
import { ToastController } from '@ionic/angular';

@Injectable()
export class XpService extends RemotePersistentDataService<Xp> {

    constructor(
        db: AngularFirestore,
        private connectedUserService: ConnectedUserService,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix() {
        return 'xp';
    }

    getPriority(): number {
        return 4;
    }

    /** Overide to restrict to the coachings of the user */
    public all(): Observable<ResponseWithData<Xp[]>> {
        return this.query(this.getBaseQueryMyAssessments(), 'default');
    }

    /** Query basis for coaching limiting access to the coachings of the user */
    private getBaseQueryMyAssessments(): Query {
        return this.getCollectionRef().where('coachId', '==', this.connectedUserService.getCurrentUser().id);
    }

    public searchXps(text: string): Observable<ResponseWithData<Xp[]>> {
        if (text) {
            const texts = text.trim().split(' ');
            return super.filter(this.all(), (xp: Xp) => {
                return texts.filter((txt) =>
                    this.stringContains(text, xp.eventName)
                    ).length > 0;
            });
        } else {
            return this.all();
        }
    }
}
