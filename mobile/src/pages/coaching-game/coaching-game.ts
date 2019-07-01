import { ActivatedRoute, ParamMap } from '@angular/router';
import { Component, ViewChild, OnInit } from '@angular/core';
import { AlertController, NavController, IonSegment } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { EmailService } from '../../app/service/EmailService';
import { ConnectedUserService } from '../../app/service/ConnectedUserService';
import { RefereeService } from '../../app/service/RefereeService';
import { UserService } from '../../app/service/UserService';
import { ResponseWithData } from '../../app/service/response';
import { CoachingService } from '../../app/service/CoachingService';
import { BookmarkService, Bookmark } from '../../app/service/BookmarkService';
import { Referee, User } from '../../app/model/user';
import { Coaching, PositiveFeedback, Feedback } from '../../app/model/coaching';

/**
 * Generated class for the CoachingGamePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-coaching-game',
  templateUrl: 'coaching-game.html',
  styleUrls: ['coaching-game.scss']
})
export class CoachingGamePage implements OnInit {

  coaching: Coaching;
  currentRefereeIdx = 0;
  currentReferee: Referee;
  id2referee: Map<string, Referee> = new Map<string, Referee>();
  refereesLoaded = false;
  currentPeriod = 1;
  coachingCoach = '';
  coachingOwner = true;
  readonly = false;
  appCoach: User;

  @ViewChild(IonSegment) segment: IonSegment;

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    public coachingService: CoachingService,
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public refereeService: RefereeService,
    public alertCtrl: AlertController,
    private bookmarkService: BookmarkService) {
      this.coaching = null;
  }

  ngOnInit() {
    console.log('CoachingGame.ngOnInit()');
    // this.route.url
    this.coaching = null;
    this.appCoach = this.connectedUserService.getCurrentUser();
    this.loadCoaching().subscribe((response: ResponseWithData<Coaching>) => {
      this.coaching = this.clean(response.data);
      if (!this.coaching) {
        console.log('Error when loading coaching', response.error);
        this.navController.navigateRoot('/home');
      } else {
        console.log('Coaching loaded', this.coaching);
        this.computeCoachingValues();
        this.loadingReferees();
        this.bookmarkPage();
      }
    });
  }

  computeCoachingValues() {
    if (!this.coaching.currentPeriod) {
      this.coaching.currentPeriod = 1;
    }
    this.coachingOwner =  this.coaching.coachId === this.appCoach.id;
    this.coachingCoach = (this.coachingOwner ? 'me' : 'another coach');
    this.readonly = !this.coachingOwner || this.coaching.closed;
  }

  private clean(coaching: Coaching): Coaching {
    if (coaching && coaching.referees) {
      let idx = 0;
      while (idx < coaching.referees.length) {
        if (coaching.referees[idx].refereeShortName) {
          idx++;
        } else {
          coaching.referees.splice(idx, 1);
        }
      }
    }
    return coaching;
  }

  setPeriod(period: number) {
    console.log('setPeriod', period);
    this.coaching.currentPeriod = period;
    this.saveCoaching();
  }

  saveNback() {
    if (this.coaching.closed || !this.coachingOwner) {
      this.navController.navigateRoot(`/coaching/edit/${this.coaching.id}`);
    } else {
      this.coachingService.save(this.coaching).subscribe(() => {
        this.navController.navigateRoot(`/coaching/edit/${this.coaching.id}`);
      });
    }
  }

  public saveCoaching() {
    this.coachingService.save(this.coaching).subscribe(() => {});
  }

  public getReferee(idx: number): string {
    const refereeId = this.coaching.referees[idx].refereeId;
    if (refereeId === null) {
      return '';
    }
    const referee: Referee = this.id2referee.get(refereeId);
    if (referee) {
      return referee.shortName;
    } else {
      return '';
    }
  }

  public coachAsEmail(): boolean {
    const coachEmmail: string = this.connectedUserService.getCurrentUser().email;
    return coachEmmail && coachEmmail.trim().length > 0;
  }

  private loadCoaching(): Observable<ResponseWithData<Coaching>> {
    return this.route.paramMap.pipe(
      flatMap( (paramMap: ParamMap) => {
        const id = paramMap.get('id');
        return this.coachingService.get(id);
      })
    );
  }

  private loadingReferees() {
    this.coachingService.loadingReferees(this.coaching, this.id2referee).pipe(
      flatMap( () => {
        // referee loaded
        this.refereesLoaded = true;
        return this.route.queryParamMap;
      }),
      map((queryParamMap) => {
          // search if a tab is expected in url, otherwise select the first tab
          const refereeIdxStr: string = queryParamMap.get('refereeIdx');
          const refereeIdx = refereeIdxStr ? Number.parseInt(refereeIdxStr, 10) : 0;
          this.refereeSelected(refereeIdx);
          return refereeIdx;
      })
    ).subscribe();
  }

  private bookmarkPage() {
    const refereeNames: string[] = this.coaching.referees.map((referee) => referee.refereeShortName);
    const datestring = ('0' + this.coaching.date.getDate()).slice(-2) + '/'
      + ('0' + (this.coaching.date.getMonth() + 1)).slice(-2) + ' '
      + ('0' + this.coaching.date.getHours()).slice(-2) + ':'
      + ('0' + this.coaching.date.getMinutes()).slice(-2);

    this.bookmarkService.addBookmarkEntry({
      id: 'coach' + this.coaching.id,
      label: 'Coach ' + datestring + ' ' + refereeNames.join(','),
      url: `/coaching/edit/${this.coaching.id}` });
    const ctx: Bookmark[] = [];
    this.coaching.referees.forEach((referee) => {
      ctx.push(
        {
          id: 'referee' + referee.refereeId,
          label: 'Referee ' + referee.refereeShortName,
          url: `/referee/view/${referee.refereeId}` }
      );
    });
    this.bookmarkService.setContext(ctx);
  }

  refereeSelected(refereeIndex: number) {
    if (this.segment) { // prevent call before the component has been initialised.
      // console.log('refereeSelected(' + refereeIndex + ')', 'Segment.value=' + this.segment.value);
      this.currentRefereeIdx = Math.max(0, Math.min(refereeIndex, this.coaching.referees.length - 1));
      this.segment.value = String(this.currentRefereeIdx);
      this.currentReferee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
    }
  }

  lookingForUpgrade(): boolean {
    const ref: Referee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
    if (ref) {
      const res: boolean = ref && ref.referee.nextRefereeLevel && ref.referee.nextRefereeLevel != null;
      return res;
    } else {
      // console.log('lookingForUpgrade: referee not found !', this.coaching.referees[this.currentRefereeIdx].refereeId, this.id2referee);
      return false;
    }
  }

  makeNotEmpty(value: string, defaultValue: string): string {
    return value && value.trim().length > 0 ?  value : defaultValue;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////// POSITIVE FEEDBACK ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////

  public deletePositiveFeedback(idx: number) {
    this.alertCtrl.create({
      message: 'Do you want to delete the positive feedback '
                + this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks[idx].skillName + '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks.splice(idx, 1);
            this.saveCoaching();
          }
        }
      ]
    }).then( (alert) => alert.present());
  }

  public deliverPositiveFeedback(feedback: PositiveFeedback, feedbackIndex: number) {
    if (!this.readonly) {
      feedback.deliver = !feedback.deliver;
      this.saveCoaching();
    }
  }

  public newPositiveFeedback(event) {
    this.navController.navigateRoot(`/coaching/coach/${this.coaching.id}/referee/${this.currentRefereeIdx}/positiveFeedback/-1`);
  }

  public selectPositiveFeedback(positiveFeedback: PositiveFeedback, index: number) {
    this.navController.navigateRoot(`/coaching/coach/${this.coaching.id}/referee/${this.currentRefereeIdx}/positiveFeedback/${index}`);
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////// IMPROVMENT FEEDBACK //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////////////

  public newFeedback(event) {
    this.navController.navigateRoot([`/coaching/coach/${this.coaching.id}/referee/${this.currentRefereeIdx}/negativeFeedback/-1`]);
  }

  public deleteFeedback(idx: number) {
    this.alertCtrl.create({
      message: 'Do you want to delete the feedback '
                + this.coaching.referees[this.currentRefereeIdx].feedbacks[idx].problemShortDesc + ' ?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            console.log('Deleting feedback.');
            this.coaching.referees[this.currentRefereeIdx].feedbacks.splice(idx, 1);
            this.saveCoaching();
          }
        }
      ]
    }).then( (alert) => alert.present());
  }

  public deliverFeedback(feedback: Feedback, feedbackIndex: number) {
    if (!this.readonly) {
      feedback.deliver = !feedback.deliver;
      this.saveCoaching();
    }
  }

  public selectFeedback(feedback: Feedback, idx: number) {
    this.navController.navigateRoot([`/coaching/coach/${this.coaching.id}/referee/${this.currentRefereeIdx}/negativeFeedback/${idx}`]);
  }
  onSwipe(event) {
    // console.log('onSwipe', event);
    if (event.direction === 4) {
      this.saveNback();
    }
  }
}
