import { DateService } from './DateService';
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
        private dateService: DateService,
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
    protected adjustFieldOnLoad(item: Competition) {
        const d: any = item.date;
        if (!(d instanceof Date) ) {
          item.date = d.toDate();
        }
    }
    public searchCompetitions(text: string, options: 'default' | 'server' | 'cache' = 'default'): Observable<ResponseWithData<Coaching[]>> {
        const str = text !== null && text && text.trim().length > 0 ? text.trim() : null;
        return str ?
            super.filter(this.allO(options), (item: Competition) => {
                return this.stringContains(str, item.name);
            })
            : this.allO(options);
    }
    public sortCompetitions(competitions: Competition[], reverse: boolean = false): Competition[] {
        let array: Competition[] = competitions.sort(this.compareCompetition.bind(this));
        if (reverse) {
            array = array.reverse();
        }
        return array;
    }

    public compareCompetition(competition1: Competition, competition2: Competition): number {
        let res = 0;
        if (res === 0) {
          // Compare date
          res = this.dateService.compareDate(competition1.date, competition2.date);
        }
        if (res === 0) {
          // compare competition name
          res = competition1.name.localeCompare(competition2.name);
        }
        return res;
    }
}
