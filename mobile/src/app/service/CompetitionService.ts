import { Competition } from './../model/competition';
import { map } from 'rxjs/operators';
import { ConnectedUserService } from './ConnectedUserService';
import { AngularFirestore, Query } from 'angularfire2/firestore';
import { Observable, forkJoin } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { ToastController } from '@ionic/angular';

@Injectable()
export class CompetitionService extends RemotePersistentDataService<Competition> {

    constructor(
        db: AngularFirestore,
        private connectedUserService: ConnectedUserService,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix() {
        return 'competition';
    }

    getPriority(): number {
        return 4;
    }

    public searchCompetitions(text: string): Observable<ResponseWithData<Competition[]>> {
        if (text) {
            const texts = text.trim().split(' ');
            return super.filter(this.all(), (c: Competition) => {
                return texts.filter((txt) =>
                    this.stringContains(text, c.name)
                    ).length > 0;
            });
        } else {
            return this.all();
        }
    }
}
