import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { EmailService } from './../../app/service/EmailService';
import { RefereeService } from './../../app/service/RefereeService';
import { ResponseWithData } from './../../app/service/response';
import { CoachingService } from './../../app/service/CoachingService';
import { RefereeSelectPage } from './../referee-select/referee-select';
import { UserService } from './../../app/service/UserService';
import { AppSettingsService } from '../../app/service/AppSettingsService';
import { ConnectedUserService } from '../../app/service/ConnectedUserService';
import { Coaching } from '../../app/model/coaching';
import { User, Referee } from '../../app/model/user';

/**
 * Generated class for the CoachingNewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-coaching-edit',
  templateUrl: 'coaching-edit.html',
  styleUrls: ['coaching-edit.scss']
})
export class CoachingEditPage implements OnInit {

  coaching: Coaching = null;
  coachingCoach = '';
  coachingOwner = true;
  readonly = false;
  appCoach: User;
  id2referee: Map<string, Referee> = new Map<string, Referee>();
  refereesLoaded = false;

  constructor(
    private modalController: ModalController,
    private route: ActivatedRoute,
    private navController: NavController,
    public connectedUserService: ConnectedUserService,
    public userService: UserService,
    public refereeService: RefereeService,
    public coachingService: CoachingService,
    public appSettingsService: AppSettingsService,
    public emailService: EmailService) {
  }

  ngOnInit() {
    console.log('CoachingEdit.ngOnInit()');
    this.appCoach = this.connectedUserService.getCurrentUser();
    this.loadCoaching().subscribe((response: ResponseWithData<Coaching>) => {
      this.coaching = response.data;
      if (this.coaching) {
        this.computeCoachingValues();
        this.loadingReferees();
      } else {
        this.initCoaching();
      }
    });
  }

  switchLockCoaching() {
    this.coaching.closed = !this.coaching.closed;
    this.computeCoachingValues();
    this.coachingService.save(this.coaching).subscribe();
  }
  get closed() {
    return this.coaching.closed;
  }

  private loadCoaching(): Observable<ResponseWithData<Coaching>> {
    return this.route.paramMap.pipe(
      flatMap( (paramMap) => this.coachingService.get(paramMap.get('id')))
    );
  }

  initCoaching() {
    this.coaching = {
        id: null,
        version: 0,
        creationDate : new Date(),
        lastUpdate : new Date(),
        dataStatus: 'NEW',
        competition: this.appCoach.defaultCompetition,
        field: '1',
        date : new Date(),
        timeSlot: this.computeTimeSlot(new Date()),
        coachId: this.appCoach.id,
        gameCategory: 'OPEN',
        gameSpeed: 'Medium',
        gameSkill: 'Medium',
        referees : [],
        currentPeriod : 1,
        closed: false
      };
    this.computeCoachingValues();
  }

  computeCoachingValues() {
    if (!this.coaching.currentPeriod) {
      this.coaching.currentPeriod = 1;
    }
    this.coachingOwner =  this.coaching.coachId === this.appCoach.id;
    this.coachingCoach = (this.coachingOwner ? 'me' : 'another coach');
    this.readonly = !this.coachingOwner || this.coaching.closed;
  }

  private loadingReferees() {
    this.coachingService.loadingReferees(this.coaching, this.id2referee).subscribe(() => {
      this.refereesLoaded = true;
    });
  }

  getReferee(idx: number): string {
    if (idx >= this.coaching.referees.length) {
      return null;
    }
    const refereeId = this.coaching.referees[idx].refereeId;
    if (refereeId === null) {
      return '';
    }
    const referee: Referee = this.id2referee.get(refereeId);
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
    this.userService.update(this.coaching.coachId, (user: User) => { user.defaultCompetition = c; return user; }).subscribe();
  }

  get date() {
    return this.coachingService.getCoachingDateAsString(this.coaching);
  }

  set date(dateStr: string) {
    this.coachingService.setStringDate(this.coaching, dateStr);
  }

  async searchReferee(idx: number) {
    const modal = await this.modalController.create({ component: RefereeSelectPage});
    modal.onDidDismiss().then( (data) => {
      const referee = this.refereeService.lastSelectedReferee.referee;
      if (referee) {
        let coachRef;
        if (idx < this.coaching.referees.length) {
          coachRef = this.coaching.referees[idx];
        } else {
          coachRef = { refereeId: 0, refereeShortName: null, feedbacks: [], positiveFeedbacks: [], rank: 0, upgrade: 'DNS'};
          this.coaching.referees.push(coachRef);
        }
        coachRef.refereeId = referee.id;
        coachRef.refereeShortName = referee.shortName;
        this.id2referee.set(referee.id, referee);
      }
    });
    return await modal.present();
  }

  computeTimeSlot(ts: Date): string {
    return this.coachingService.computeTimeSlot(ts);
  }

  saveNback() {
    if (this.coaching.closed || !this.isValid()) {
      this.navController.navigateRoot(`/coaching/list`);
    } else {
      this.coachingService.save(this.coaching).subscribe(() => {
        console.log('saved');
        this.navController.navigateRoot(`/coaching/list`);
      });
    }
  }

  coach(event) {
    if (this.isValid()) {
      if (this.coaching.closed) {
        this.navController.navigateRoot(`/coaching/coach/${this.coaching.id}`);
      } else {
        this.coachingService.save(this.coaching).pipe(
          map((response: ResponseWithData<Coaching>) => this.navController.navigateRoot(`/coaching/coach/${this.coaching.id}`))
        ).subscribe();
      }
    }
  }

  sendCoaching() {
    this.emailService.sendEmail({
      to: this.connectedUserService.getCurrentUser().email,
      subject: this.coachingService.coachingAsEmailSubject(this.coaching),
      body: this.coachingService.coachingAsEmailBody(this.coaching),
      isHtml: true
    });
  }
  isValid(): boolean {
    return this.coaching.referees.length > 0
      && this.coaching.competition != null && this.coaching.competition.trim().length > 0;
  }
}
