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
    ) {
        super(db);
    }

    getLocalStoragePrefix() {
        return 'referee';
    }

    getPriority(): number {
        return 2;
    }

    public searchReferees(text: string): Observable<ResponseWithData<Referee[]>> {
        if (text) {
            return super.filter(super.all(), (referee: Referee) => {
                return this.stringContains(text, referee.shortName)
                    || this.stringContains(text, referee.firstName)
                    || this.stringContains(text, referee.lastName);
            });
        } else {
            return super.all();
        }
    }
}
