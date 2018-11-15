import { RefereeService } from './RefereeService';
import { Referee } from './../model/user';
import { Observable } from 'rxjs';
import { ResponseWithData } from './response';
import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Assessment } from './../model/assessment';

@Injectable()
export class AssessmentService extends RemotePersistentDataService<Assessment>{
    private TIME_SLOT_SEP : string = ':';
    private DATE_SEP : string = '-';

    constructor(
        protected appSettingsService: AppSettingsService,
        protected connectedUserService:ConnectedUserService,
        protected localDatabaseService: LocalDatabaseService,
        protected synchroService: SynchroService,
        protected http: Http,
        protected refereeService: RefereeService
    ) {
        super(appSettingsService, connectedUserService, localDatabaseService, synchroService, http);
    }

    getLocalStoragePrefix() {
        return 'assessment';
    }
    getPriority(): number { 
        return 5;
    }

    getAssessmentByReferee(refereeId: number) : Observable<ResponseWithData<Assessment[]>> {
        return super.all()
            .map((rassessments: ResponseWithData<Assessment[]>) => {
                if (!rassessments.error) {
                    rassessments.data = rassessments.data.filter( (assessment:Assessment) => {
                        //search if the assessment contains the searched referee
                        return assessment.refereeId == refereeId;
                    })
                }
                return rassessments;
        });
    }
    public sortAssessments(assessments: Assessment[], reverse: boolean = false): Assessment[] {
        let array:Assessment[] = assessments.sort(this.compareAssessment.bind(this));
        if (reverse) {
            array = array.reverse();
        }
        return array;
    }

    public compareDate(day1: Date, day2: Date):number {
        //Compare date
        let res:number = day1.getFullYear() - day2.getFullYear();
        if (res === 0) {
        res = day1.getMonth() - day2.getMonth();
        }
        if (res === 0) {
        res = day1.getDate() - day2.getDate();
        }
        return res;
    }
    public compareAssessment(assessment1:Assessment, assessment2:Assessment): number {
        let res = 0;
        if (res === 0) {
            //compare competition name
            res = assessment1.competition.localeCompare(assessment2.competition);
        }
        if (res === 0) {
          //Compare date
          res = this.compareDate(assessment1.date, assessment2.date);
        }
        if (res === 0) {
          //Compare timeslot
          let timeSlotElems1:string[] = assessment1.timeSlot.split(this.TIME_SLOT_SEP);
          let timeSlotElems2:string[] = assessment2.timeSlot.split(this.TIME_SLOT_SEP);
          const h1 = Number.parseInt(timeSlotElems1[0]);
          const h2 = Number.parseInt(timeSlotElems2[0]);
          res = h1 - h2;
    
          if (res === 0) {
            const m1 = Number.parseInt(timeSlotElems1[1]);
            const m2 = Number.parseInt(timeSlotElems2[1]);
            res = m1 - m2;
          }
        }
        if (res === 0) {
          //Compare field
          res = Number.parseInt(assessment1.field) - Number.parseInt(assessment2.field);
        }
        return res;
    }
    public computeTimeSlot(ts: Date): string {
        return this.to2Digit(ts.getHours()) + this.TIME_SLOT_SEP + this.to2Digit(ts.getMinutes());
    }
    public to2Digit(nb: number): string {
        return (nb < 10 ? '0' : '') + nb;
    }
    public getAssessmentDateAsString (assessment: Assessment) {
        return assessment.date.getFullYear() 
          + this.DATE_SEP + this.to2Digit(assessment.date.getMonth()+1) 
          + this.DATE_SEP + this.to2Digit(assessment.date.getDate());
    }
    public setStringDate(assessment: Assessment, dateStr: string) {
        const elements = dateStr.split(this.DATE_SEP);
        if (!assessment.date) {
            assessment.date = new Date();
        }
        assessment.date.setFullYear(Number.parseInt(elements[0]));
        assessment.date.setMonth(Number.parseInt(elements[1])-1);
        assessment.date.setDate(Number.parseInt(elements[2]));
    }

    public loadingReferees(assessment:Assessment, id2referee: Map<number, Referee>):Observable<string> {
        if (assessment && assessment.refereeId !== 0) {
            return this.refereeService.get(assessment.refereeId).map((res: ResponseWithData<Referee>) => {
                if (res.data) {
                    id2referee.set(res.data.id, res.data); 
                } else {
                    console.error('Referee ' + assessment.refereeId + ' does not exist !');
                }
                return '';
            });
        }  else {
            return Observable.of('');  
        }
    }

    
    public assessmentAsEmailBody(assessment: Assessment): string {
        let body:string = `
        <ul>
          <li> Competition: ${assessment.competition}</li>
          <li> Referee: ${assessment.refereeShortName}</li>
          <li> Profile: ${assessment.profileId}</li>
          <li> Date: ${this.getAssessmentDateAsString(assessment)}</li>
          <li> Field: ${assessment.field}</li>
          <li> Time slot: ${assessment.timeSlot}</li>
          <li> Game category: ${assessment.gameCategory}</li>
          <li> Game speed: ${assessment.gameSpeed}</li>
          <li> Game skill: ${assessment.gameSkill}</li>
        </ul>`;
        body += `<h2>Referee ${assessment.refereeShortName}</h2>`;

        

        body += `<h3>Misc</h3>`
        return body;
    }

    public assessmentAsEmailSubject(assessment: Assessment): string {
        return `Referee Assessment ${assessment.competition}, ${this.getAssessmentDateAsString(assessment)}, ${assessment.timeSlot}, Field ${assessment.field}`;
    }
}