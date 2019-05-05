import { ToastController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Referee } from './../model/user';

@Injectable()
export class RefereeService extends RemotePersistentDataService<Referee> {

    public lastSelectedReferee: { referee: Referee, idx: number} = {referee: null, idx: -1};

    constructor(
        db: AngularFirestore,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix() {
        return 'referee';
    }

    getPriority(): number {
        return 2;
    }

    public searchReferees(text: string): Observable<ResponseWithData<Referee[]>> {
        const validText = text && text !== null  && text.trim().length > 0 ? text.trim() : null;
        // console.log('RefereeService.searchReferees(' + validText + ')');
        if (validText !== null) {
            return super.filter(super.all(), (referee: Referee) => {
                return this.stringContains(validText, referee.shortName)
                    || this.stringContains(validText, referee.firstName)
                    || this.stringContains(validText, referee.lastName);
            });
        } else {
            return super.all();
        }
    }
}
