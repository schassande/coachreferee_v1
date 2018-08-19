import { EmailService } from './../../app/service/EmailService';
import { RefereeService } from './../../app/service/RefereeService';
import { Observable } from 'rxjs';
import { CoachingGamePage } from './../coaching-game/coaching-game';
import { ResponseWithData } from './../../app/service/response';
import { CoachingService } from './../../app/service/CoachingService';
import { RefereeSelectPage } from './../referee-select/referee-select';
import { UserService } from './../../app/service/UserService';
import { AppSettingsService } from '../../app/service/AppSettingsService';
import { ConnectedUserService } from '../../app/service/ConnectedUserService';
import { Coaching } from '../../app/model/coaching';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { User, Referee } from '../../app/model/user';

/**
 * Generated class for the CoachingNewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-coaching-edit',
  templateUrl: 'coaching-edit.html',
})
export class CoachingEditPage {

  coaching: Coaching = null;
  id2referee: Map<number, Referee> = new Map<number, Referee>();
  refereesLoaded:boolean = false;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public connectedUserService: ConnectedUserService,
    public userService: UserService,
    public refereeService: RefereeService,
    public coachingService: CoachingService,
    public appSettingsService: AppSettingsService,
    public emailService: EmailService) {
  }

  ionViewDidLoad() {
    this.loadCoaching().subscribe((response: ResponseWithData<Coaching>) => {
      this.coaching = response.data; 
      if (this.coaching) {
        this.loadingReferees();
      } else {
        this.initCoaching();
      }
    });
    
  }
  private loadCoaching():Observable<ResponseWithData<Coaching>> {
    const coaching:Coaching = this.navParams.get('coaching');
    const coachingId = this.navParams.get('coachingId');
    return (coaching || !coachingId) 
      ? Observable.of({data : coaching, error: null}) 
      :  this.coachingService.get(coachingId);
  }

  initCoaching() {
    let coach: User = this.connectedUserService.getCurrentUser();    
    this.coaching = {
        id: 0,
        version: 0,
        creationDate : new Date(),
        lastUpdate : new Date(),
        dataStatus: 'NEW',
        competition: coach.defaultCompetition,
        field: '1',
        date : new Date(),
        timeSlot: this.computeTimeSlot(new Date()),
        coachId: coach.id,
        gameCategory: 'OPEN',
        gameSpeed: 'Medium',
        gameSkill: 'Medium',
        referees : [
          { refereeId: 0, refereeShortName: null, feedbacks: [], positiveFeedbacks: [], rank: 0, upgrade: 'DNS'}, 
          { refereeId: 0, refereeShortName: null, feedbacks: [], positiveFeedbacks: [], rank: 0, upgrade: 'DNS'}, 
          { refereeId: 0, refereeShortName: null, feedbacks: [], positiveFeedbacks: [], rank: 0, upgrade: 'DNS'}]
      }
  }
  private loadingReferees() {
    this.coachingService.loadingReferees(this.coaching, this.id2referee).subscribe(() => {
      this.refereesLoaded = true;
    });
  }

  getReferee(idx: number): string {
    const refereeId = this.coaching.referees[idx].refereeId;
    if (refereeId === 0) {
      return '';
    }
    let referee:Referee = this.id2referee.get(refereeId);
    if (referee) {
      return referee.firstName + ' (' + referee.shortName + ')';
    } else {
      return this.coaching.referees[idx].refereeShortName;
    }
  }

  get competition() {
    return this.coaching.competition;
  }

  set competition(c: string) {
    this.coaching.competition = c;
    this.userService.update(this.coaching.coachId, (user:User) => { user.defaultCompetition = c; return user; }).subscribe();
  }

  get date () {
    return this.coachingService.getCoachingDateAsString(this.coaching);
  }

  set date(dateStr: string) {
    this.coachingService.setStringDate(this.coaching, dateStr);
  }

  searchReferee(idx: number) {
    const coachRef = this.coaching.referees[idx];
    const mapId2referee = this.id2referee;
    const callbackRefereeSelected = function(referee:Referee) {
      console.log("Selected referee (" + idx + ', ' + referee.id + ')');
      coachRef.refereeId = referee.id;
      coachRef.refereeShortName = referee.shortName;
      mapId2referee.set(referee.id, referee);
    }
    this.navCtrl.push(RefereeSelectPage, { callback: callbackRefereeSelected });
  }

  computeTimeSlot(ts: Date): string {
    return this.coachingService.computeTimeSlot(ts);
  }

  coach(event) {
    this.coachingService.save(this.coaching)
      .map((response: ResponseWithData<Coaching>) => {
        this.navCtrl.setRoot(CoachingGamePage, { coachingId: response.data.id, coaching: response.data });
      }).subscribe();
  }

  sendCoaching() {
    this.emailService.sendEmail({
      to: this.connectedUserService.getCurrentUser().email,
      subject: this.coachingService.coachingAsEmailSubject(this.coaching),
      body: this.coachingService.coachingAsEmailBody(this.coaching),
      isHtml: true
    });
  }
}
