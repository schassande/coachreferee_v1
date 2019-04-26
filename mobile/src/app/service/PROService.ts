import { AngularFirestore } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { PersistentPRO } from './../model/coaching';

@Injectable()
export class PROService extends RemotePersistentDataService<PersistentPRO> {

    constructor(
        db: AngularFirestore,
    ) {
        super(db);
    }

    getLocalStoragePrefix() {
        return 'pro';
    }

    getPriority(): number {
        return 4;
    }
    public searchPros(text: string): Observable<ResponseWithData<PersistentPRO[]>> {
        if (text) {
            const texts = text.trim().split(' ');
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
