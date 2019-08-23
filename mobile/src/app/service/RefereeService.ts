import { AppSettingsService } from './AppSettingsService';
import { ToastController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Referee } from './../model/user';
import { PersistentDataFilter } from './PersistentDataFonctions';

@Injectable()
export class RefereeService extends RemotePersistentDataService<Referee> {

    public lastSelectedReferee: { referee: Referee, idx: number} = {referee: null, idx: -1};

    constructor(
        appSettingsService: AppSettingsService,
        db: AngularFirestore,
        toastController: ToastController
    ) {
        super(appSettingsService, db, toastController);
    }

    getLocalStoragePrefix() {
        return 'referee';
    }

    getPriority(): number {
        return 2;
    }
    public findByShortName(shortName: string): Observable<ResponseWithData<Referee[]>> {
        return super.filter(super.all(), this.getFilterByShortName(shortName));
    }

    public searchReferees(text: string): Observable<ResponseWithData<Referee[]>> {
        return super.filter(super.all(), this.getFilterByText(text));
    }

    public getFilterByText(text: string): PersistentDataFilter<Referee> {
        const validText = text && text !== null  && text.trim().length > 0 ? text.trim() : null;
        return validText === null ? null : (referee: Referee) => {
            return this.stringContains(validText, referee.shortName)
                || this.stringContains(validText, referee.firstName)
                || this.stringContains(validText, referee.lastName);
        };
    }
    public getFilterByShortName(text: string): PersistentDataFilter<Referee> {
        const validText = text && text !== null  && text.trim().length > 0 ? text.trim() : null;
        return validText === null ? null : (referee: Referee) => validText === referee.shortName;
    }
}
