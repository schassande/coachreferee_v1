import { Referee } from './../model/user';
import { RefereeService } from './RefereeService';
import { ResponseWithData } from './response';
import { Observable } from 'rxjs/Rx';
import { Http } from '@angular/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { Coaching } from './../model/coaching';

@Injectable()
export class CoachingService extends RemotePersistentDataService<Coaching>{

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
        return 'coaching';
    }

    getPriority(): number { 
        return 5;
    }

    getCoachingByReferee(refereeId: number) : Observable<ResponseWithData<Coaching[]>> {
        return super.all()
            .map((rcoachings: ResponseWithData<Coaching[]>) => {
                if (!rcoachings.error) {
                    rcoachings.data = rcoachings.data.filter( (coaching:Coaching) => {
                        //search if the coaching contains the searched referee
                        return coaching.referees.filter( (ref) => refereeId === ref.refereeId).length > 0;
                    })
                }
                return rcoachings;
        });
    }
    public sortCoachings(coachings: Coaching[], reverse: boolean = false): Coaching[] {
        let array:Coaching[] = coachings.sort(this.compareCoaching.bind(this));
        if (reverse) {
            array = array.reverse();
        }
        return array;
    }
    public searchCoachings(text: string): Observable<ResponseWithData<Coaching[]>> {
        const str = text && text.trim().length > 0 ? text.trim() : null;
        return str ? 
            super.filter(super.all(), (coaching: Coaching) => {
                return this.stringContains(str, coaching.competition)
                || (coaching.referees[0] && this.stringContains(str, coaching.referees[0].refereeShortName))
                || (coaching.referees[1] && this.stringContains(str, coaching.referees[1].refereeShortName))
                || (coaching.referees[2] && this.stringContains(str, coaching.referees[2].refereeShortName))
                || this.stringContains(str, coaching.field)
                || this.stringContains(str, this.getCoachingDateAsString(coaching))
            })
            : super.all();
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
    public compareCoaching(coaching1:Coaching, coaching2:Coaching): number {
        let res = 0;
        if (res === 0) {
            //compare competition name
            res = coaching1.competition.localeCompare(coaching2.competition);
        }
        if (res === 0) {
          //Compare date
          res = this.compareDate(coaching1.date, coaching2.date);
        }
        if (res === 0) {
          //Compare timeslot
          let timeSlotElems1:string[] = coaching1.timeSlot.split(this.TIME_SLOT_SEP);
          let timeSlotElems2:string[] = coaching2.timeSlot.split(this.TIME_SLOT_SEP);
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
          res = Number.parseInt(coaching1.field) - Number.parseInt(coaching2.field);
        }
        return res;
    }
    public computeTimeSlot(ts: Date): string {
        return this.to2Digit(ts.getHours()) + this.TIME_SLOT_SEP + this.to2Digit(ts.getMinutes());
    }
    public to2Digit(nb: number): string {
        return (nb < 10 ? '0' : '') + nb;
    }
    public getCoachingDateAsString (coaching: Coaching) {
        return coaching.date.getFullYear() 
          + this.DATE_SEP + this.to2Digit(coaching.date.getMonth()+1) 
          + this.DATE_SEP + this.to2Digit(coaching.date.getDate());
    }
    public setStringDate(coaching: Coaching, dateStr: string) {
        const elements = dateStr.split(this.DATE_SEP);
        if (!coaching.date) {
            coaching.date = new Date();
        }
        coaching.date.setFullYear(Number.parseInt(elements[0]));
        coaching.date.setMonth(Number.parseInt(elements[1])-1);
        coaching.date.setDate(Number.parseInt(elements[2]));
    }

    public loadingReferees(coaching:Coaching, id2referee: Map<number, Referee>) {
        if (coaching) {
          let obs:Observable<ResponseWithData<Referee>>[] =[];
          coaching.referees.forEach((ref) => {
            if (ref.refereeId !== 0) {
              obs.push(this.refereeService.get(ref.refereeId).map((res: ResponseWithData<Referee>) => {
                if (res.data) {
                    id2referee.set(res.data.id, res.data); 
                } else {
                    console.error('Referee ' + ref.refereeId + ' does not exist !');
                }
                return res;
              }));
            }
          });
          return Observable.combineLatest(obs);
        }  else {
          return Observable.empty();  
        }
    }

    public coachingAsEmailBody(coaching: Coaching): string {
        let body:string = `
        <ul>
          <li> Competition: ${coaching.competition}</li>
          <li> Date: ${this.getCoachingDateAsString(coaching)}</li>
          <li> Field: ${coaching.field}</li>
          <li> Time slot: ${coaching.timeSlot}</li>
          <li> Game category: ${coaching.gameCategory}</li>
          <li> Game speed: ${coaching.gameSpeed}</li>
          <li> Game skill: ${coaching.gameSkill}</li>
        </ul>`;
        coaching.referees.forEach((referee) => {
          if (referee.refereeShortName) {
            body += `<h2>Referee ${referee.refereeShortName}</h2>`;
    
            body += `<h3>Positive points</h3>`;
            body += `<ul>`;
            referee.positiveFeedbacks.forEach(positiveFeedback => {
              body += `<li>${positiveFeedback.skillName}: ${positiveFeedback.description}</li>`;
            });
            body += `</ul>`;
    
            body += `<h3>Axis of improvment</h3>`;
            referee.feedbacks.forEach(feedback => {
              body += `<h4>${feedback.problemShortDesc}</h4>
              <ul>
                <li>Skill: ${feedback.skillName}</li>
                <li>Problem: ${feedback.problemShortDesc}</li>
                <li>Remedy: ${feedback.remedy}</li>
                <li>Outcome: ${feedback.outcome}</li>
                <li>Period: ${feedback.period}</li>
                <li>Improvement during the game: ${feedback.appliedLater}</li>
                <li>Priority: ${feedback.priority}</li>
              </ul>`;
            });

            body += `<h3>Misc</h3>
            upgrade: ${referee.upgrade}, <br>
            rank: ${referee.rank}`;
          }
        });
        return body;
    }

    public coachingAsEmailSubject(coaching: Coaching): string {
        return `Referee Coaching ${coaching.competition}, ${this.getCoachingDateAsString(coaching)}, ${coaching.timeSlot}, Field ${coaching.field}`;
    }
}