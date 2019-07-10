import { CompetitionService } from './CompetitionService';
import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable, from, of } from 'rxjs';
import { flatMap } from 'rxjs/operators';

import { AssessmentService } from './AssessmentService';
import { CoachingService } from './CoachingService';
import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { RefereeService } from './RefereeService';
import { PROService } from './PROService';
import { SkillProfileService } from './SkillProfileService';

@Injectable()
export class OfflinesService  {

    constructor(
        private refereeService: RefereeService,
        private proService: PROService,
        private skillProfileService: SkillProfileService,
        private coachingService: CoachingService,
        private assessmentService: AssessmentService,
        private competitionService: CompetitionService,
        private firestore: AngularFirestore,
        private appSettingsService: AppSettingsService
    ) {}

    public switchOfflineMode(): Observable<LocalAppSettings> {
        let settings = null;
        return this.appSettingsService.get().pipe(
            flatMap((s: LocalAppSettings) => {
                settings = s;
                console.log('switchOfflineMode() =>', !settings.forceOffline);
                let obs: Observable<any> = null;
                if (settings.forceOffline) {
                    // preload data
                    obs = this.skillProfileService.preload().pipe(
                        flatMap(() => this.refereeService.preload()),
                        flatMap(() => this.proService.preload()),
                        flatMap(() => this.coachingService.preload()),
                        flatMap(() => this.assessmentService.preload()),
                        flatMap(() => this.competitionService.preload()),
                        // then disable the network
                        flatMap(() => from(this.firestore.firestore.disableNetwork())),
                    );
                } else {
                    // Enable the network
                    obs = from(this.firestore.firestore.enableNetwork());
                }
                // store the offline mode
                return obs.pipe(
                    flatMap( () => {
                        settings.forceOffline = !settings.forceOffline;
                        return this.appSettingsService.save(settings);
                    })
                );
            })
        );
    }
}
