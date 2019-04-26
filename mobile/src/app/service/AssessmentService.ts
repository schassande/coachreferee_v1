import { AngularFirestore } from 'angularfire2/firestore';
import { SkillProfile } from './../model/skill';
import { RefereeService } from './RefereeService';
import { Referee, User } from './../model/user';
import { ResponseWithData } from './response';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Assessment } from './../model/assessment';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

const TIME_SLOT_SEP = ':';
const DATE_SEP = '-';

@Injectable()
export class AssessmentService extends RemotePersistentDataService<Assessment> {

    /** The current edited assessment */
    public currentAssessment: Assessment = null;

    constructor(
        db: AngularFirestore,
        protected refereeService: RefereeService
    ) {
        super(db);
    }

    getLocalStoragePrefix() {
        return 'assessment';
    }
    getPriority(): number {
        return 5;
    }

    getAssessmentByReferee(refereeId: string): Observable<ResponseWithData<Assessment[]>> {
        return super.all()
            .pipe(
                map((rassessments: ResponseWithData<Assessment[]>) => {
                    if (!rassessments.error) {
                        rassessments.data = rassessments.data.filter( (assessment: Assessment) => {
                            // search if the assessment contains the searched referee
                            return assessment.refereeId === refereeId;
                        });
                    }
                    return rassessments;
                })
        );
    }
    public sortAssessments(assessments: Assessment[], reverse: boolean = false): Assessment[] {
        let array: Assessment[] = assessments.sort(this.compareAssessment.bind(this));
        if (reverse) {
            array = array.reverse();
        }
        return array;
    }

    public searchAssessments(text: string): Observable<ResponseWithData<Assessment[]>> {
        const str = text && text.trim().length > 0 ? text.trim() : null;
        return str
            ?  super.filter(super.all(), (assessment: Assessment) => {
                return this.stringContains(str, assessment.competition)
                        || this.stringContains(str, assessment.refereeShortName)
                        || this.stringContains(str, assessment.profileName)
                        || this.stringContains(str, assessment.field)
                        || this.stringContains(str, this.getAssessmentDateAsString(assessment));
                })
            : super.all();
    }

    public compareDate(day1: Date, day2: Date): number {
        // Compare date
        let res: number = day1.getFullYear() - day2.getFullYear();
        if (res === 0) {
        res = day1.getMonth() - day2.getMonth();
        }
        if (res === 0) {
        res = day1.getDate() - day2.getDate();
        }
        return res;
    }
    public compareAssessment(assessment1: Assessment, assessment2: Assessment): number {
        let res = 0;
        if (res === 0) {
            // compare competition name
            res = assessment1.competition.localeCompare(assessment2.competition);
        }
        if (res === 0) {
          // Compare date
          res = this.compareDate(assessment1.date, assessment2.date);
        }
        if (res === 0) {
          // Compare timeslot
          const timeSlotElems1: string[] = assessment1.timeSlot.split(TIME_SLOT_SEP);
          const timeSlotElems2: string[] = assessment2.timeSlot.split(TIME_SLOT_SEP);
          const h1 = Number.parseInt(timeSlotElems1[0], 0);
          const h2 = Number.parseInt(timeSlotElems2[0], 0);
          res = h1 - h2;

          if (res === 0) {
            const m1 = Number.parseInt(timeSlotElems1[1], 0);
            const m2 = Number.parseInt(timeSlotElems2[1], 0);
            res = m1 - m2;
          }
        }
        if (res === 0) {
          // Compare field
          res = Number.parseInt(assessment1.field, 0) - Number.parseInt(assessment2.field, 0);
        }
        return res;
    }
    public computeTimeSlot(ts: Date): string {
        return this.to2Digit(ts.getHours()) + TIME_SLOT_SEP + this.to2Digit(ts.getMinutes());
    }
    public to2Digit(nb: number): string {
        return (nb < 10 ? '0' : '') + nb;
    }
    public getAssessmentDateAsString(assessment: Assessment) {
        return assessment.date.getFullYear()
          + DATE_SEP + this.to2Digit(assessment.date.getMonth() + 1)
          + DATE_SEP + this.to2Digit(assessment.date.getDate());
    }
    public setStringDate(assessment: Assessment, dateStr: string) {
        const elements = dateStr.split(DATE_SEP);
        if (!assessment.date) {
            assessment.date = new Date();
        }
        assessment.date.setFullYear(Number.parseInt(elements[0], 0));
        assessment.date.setMonth(Number.parseInt(elements[1], 0) - 1);
        assessment.date.setDate(Number.parseInt(elements[2], 0));
    }

    public loadingReferees(assessment: Assessment, id2referee: Map<string, Referee>): Observable<string> {
        if (assessment && assessment.refereeId !== null && assessment.refereeId.trim().length > 0) {
            return this.refereeService.get(assessment.refereeId).pipe(
                map((res: ResponseWithData<Referee>) => {
                if (res.data) {
                    id2referee.set(res.data.id, res.data);
                } else {
                    console.error('Referee ' + assessment.refereeId + ' does not exist !');
                }
                return '';
            }));
        }  else {
            return of('');
        }
    }


    public assessmentAsEmailBody(assessment: Assessment, profile: SkillProfile, coach: User, referee: Referee): string {
        let body = `
        <h1 style="text-align: center; padding: 20px; background-color:${profile.backgroundColor}; color:${profile.color}; width: 100%;">
        ${assessment.profileName} referee assessment</h1>
        <table border="0" style="margin-top: 20px;">
          <tr><td>Referee</td><td>${referee.firstName} ${referee.lastName} ${assessment.refereeShortName}</td></tr>
          <tr><td>Referee NTA</td><td>${referee.country}</td></tr>
          <tr><td>Assessment level</td><td>${assessment.profileName}</td></tr>
          <tr><td>Referee coach</td><td>${coach.firstName} ${coach.lastName} (${coach.refereeCoach.refereeCoachLevel})</td></tr>
          <tr><td>Competition</td><td>${assessment.competition}</td></tr>
          <tr><td>Date</td><td>${this.getAssessmentDateAsString(assessment)}</td></tr>
          <tr><td>Field</td><td>${assessment.field}</td></tr>
          <tr><td>Time slot</td><td>${assessment.timeSlot}</td></tr>
          <tr><td>Game category</td><td>${assessment.gameCategory}</td></tr>
          <tr><td>Game speed</td><td>${assessment.gameSpeed}</td></tr>
          <tr><td>Game skill</td><td>${assessment.gameSkill}</td></tr>
        </table>`;

        assessment.skillSetEvaluation.forEach( (skillSetEval) => {
            body += `<h2 style="margin-top: 20px;">${skillSetEval.skillSetName}</h2>`;
            body += `<p>Competent: ${skillSetEval.competent ? 'yes' : 'no'}</p>`;
            body += `<table boder="0">`;
            skillSetEval.skillEvaluations.forEach( (skillEval) => {
                body += `<tr><td>${skillEval.skillName}</td><td>${skillEval.competent ? 'yes' : 'no'}</td></tr>`;
            });
            body += `</table>`;
        });
        body += `<h2 style="margin-top: 20px;">Conclusion</h2>`;
        body += `<p>${coach.firstName} ${coach.lastName} declares the referee ${
            assessment.competent ? '' : 'NOT '}competent for the level ${assessment.profileName}.</p>`;

        return body;
    }

    public assessmentAsEmailSubject(assessment: Assessment): string {
        return `Referee Assessment ${assessment.competition}, ${this.getAssessmentDateAsString(assessment)}, ${
            assessment.timeSlot}, Field ${assessment.field}`;
    }
}
