import { RefereeViewPage } from './../referee-view/referee-view';
import { Observable } from 'rxjs';
import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Segment } from 'ionic-angular';
import { EmailService }                       from '../../app/service/EmailService';
import { ConnectedUserService }               from '../../app/service/ConnectedUserService';
import { RefereeService }                     from '../../app/service/RefereeService';
import { UserService }                        from '../../app/service/UserService';
import { ResponseWithData }                   from '../../app/service/response';
import { CoachingService }                    from '../../app/service/CoachingService';
import { BookmarkService, Bookmark }          from '../../app/service/BookmarkService';
import { Referee, User }                            from '../../app/model/user';
import { CoachingImprovmentFeedbackEditPage } from '../coaching-improvment-feedback-edit/coaching-improvment-feedback-edit';
import { CoachingPositiveFeedbackEditPage }   from '../coaching-positive-feedback-edit/coaching-positive-feedback-edit';
import { Coaching, PositiveFeedback, Feedback } from '../../app/model/coaching';

/**
 * Generated class for the CoachingGamePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-coaching-game',
  templateUrl: 'coaching-game.html',
})
export class CoachingGamePage {

  coaching: Coaching;
  currentRefereeIdx: number = 0;
  currentReferee: Referee;
  id2referee: Map<number, Referee> = new Map<number, Referee>();
  refereesLoaded = false;
  currentPeriod: number = 1;
  coachingCoach:string = '';
  coachingOwner:boolean = true;
  readonly:boolean = false;
  appCoach:User;

  @ViewChild(Segment) segment :Segment;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public coachingService: CoachingService,
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public refereeService: RefereeService,
    public alertCtrl: AlertController,
    private bookmarkService:BookmarkService,
    private emailService: EmailService) {
  }

  ionViewDidLoad() {
    this.appCoach = this.connectedUserService.getCurrentUser();    
    this.bookmarkService.clearContext();
    this.loadCoaching().subscribe((response: ResponseWithData<Coaching>) => {
        this.coaching = this.clean(response.data); 
        this.computeCoachingValues();
        this.loadingReferees();
        this.bookmarkPage();
      });
  }

  computeCoachingValues() {
    this.coachingOwner =  this.coaching.coachId == this.appCoach.id;
    this.coachingCoach = (this.coachingOwner ? 'me' : 'another coach');
    this.readonly = !this.coachingOwner || this.coaching.closed;        
  }

  private clean(coaching:Coaching):Coaching {
    if (coaching && coaching.referees) {
      let idx = 0;
      while(idx < coaching.referees.length) {
        if (coaching.referees[idx].refereeShortName) {
          idx++;
        } else {
          coaching.referees.splice(idx, 1);
        }
      }
    }
    return coaching;
  }

  public getReferee(idx: number): string {
    const refereeId = this.coaching.referees[idx].refereeId;
    if (refereeId === 0) {
      return '';
    }
    let referee:Referee = this.id2referee.get(refereeId);
    if (referee) {
      return referee.shortName;
    } else {
      return '';
    }
  }

  public coachAsEmail(): boolean {
    const coachEmmail:string = this.connectedUserService.getCurrentUser().email;
    return coachEmmail && coachEmmail.trim().length > 0;
  }

  private loadCoaching():Observable<ResponseWithData<Coaching>> {
    const coaching:Coaching = this.navParams.get('coaching');
    const coachingId = this.navParams.get('coachingId');
    return (coaching || !coachingId) 
      ? Observable.of({data : coaching, error: null}) 
      : this.coachingService.get(coachingId);
  }

  private loadingReferees() {
    this.coachingService.loadingReferees(this.coaching, this.id2referee).subscribe(() => {
      this.refereesLoaded = true;
      this.refereeSelected(this.currentRefereeIdx);
    });
  }

  private bookmarkPage() {
    let refereeNames:string[] = this.coaching.referees.map((referee) => referee.refereeShortName);
    var datestring = ("0" + this.coaching.date.getDate()).slice(-2) + "/" 
      + ("0"+(this.coaching.date.getMonth()+1)).slice(-2) + " " 
      + ("0" + this.coaching.date.getHours()).slice(-2) + ":" 
      + ("0" + this.coaching.date.getMinutes()).slice(-2);

    this.bookmarkService.addBookmarkEntry({ 
      id: 'coach' + this.coaching.id, 
      label: 'Coach ' + datestring + ' ' + refereeNames.join(","), 
      component: CoachingGamePage, 
      parameter : { coachingId: this.coaching.id } });
    let ctx:Bookmark[] = [];
    this.coaching.referees.forEach((referee) => {
      ctx.push(
        { 
          id: 'referee' + referee.refereeId, 
          label: 'Referee ' + referee.refereeShortName, 
          component: RefereeViewPage, 
          parameter : { id: referee.refereeId } }
      );
    })      
    this.bookmarkService.setContext(ctx);
  }

  refereeSelected(refereeIndex: number) {
    console.log("refereeSelected(" + refereeIndex + ")", "Segment.value=" + this.segment.value);
    this.segment.value = String(refereeIndex);
    this.currentRefereeIdx = refereeIndex;
    this.currentReferee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
  }

  lookingForUpgrade():boolean {
    const ref:Referee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
    if (ref) {
      const res:boolean = ref && ref.referee.nextRefereeLevel && ref.referee.nextRefereeLevel != null;
      //console.log('lookingForUpgrade ', this.coaching.referees[this.currentRefereeIdx].refereeShortName, res, ref.referee.nextRefereeLevel);
      return res;
      } else {
        //console.log('lookingForUpgrade: referee not found !')
        return false;
      }
  }

  public deletePositiveFeedback(idx: number) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you want to delete the positive feedback ' + this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks[idx].skillName + '?',
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
    });
    alert.present();
  }

  public newPositiveFeedback(event) {
    let feedback: PositiveFeedback = {
      skillName: '',
      description: '',   
      period: this.currentPeriod,
      deliver: false
    }
    this.navCtrl.push(CoachingPositiveFeedbackEditPage, 
      { 
        feedback: feedback,
        index: -1, 
        callback :  this.callbackPositiveFeedback.bind(this) 
      });
  }

  public deliverPositiveFeedback(feedback: PositiveFeedback, feedbackIndex: number) {
    feedback.deliver = !feedback.deliver;
    this.saveCoaching();
  }


  public selectPositiveFeedback(positiveFeedback: PositiveFeedback, index:number) {
    this.navCtrl.push(CoachingPositiveFeedbackEditPage, 
      { 
        feedback: positiveFeedback,
        index: index, 
        readonly: this.readonly,
        callback :  this.callbackPositiveFeedback.bind(this) 
      });
  }

  public callbackPositiveFeedback(feedback:PositiveFeedback, index:number = -1) {
    if (this.readonly) { return }
    if (feedback.skillName.length == 0) {
      if (index >= 0) {
        //remove it
        this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks.splice(index, 1);
        // save the coaching
        this.saveCoaching();
      }
    } else {
      feedback.description = this.makeNotEmpty(feedback.description, feedback.skillName);
      if (index >= 0) {
        // update it
        this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks[index] = feedback;
      } else {
        // add it
        this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks.push(feedback);
      }
      // save the coaching
      this.saveCoaching();
    }
  }

  public saveCoaching() {
    this.coachingService.save(this.coaching).subscribe();
  }

  public newFeedback(event) {
    let feedback: Feedback = {
      priority: 0,
      period: this.currentPeriod,
      appliedLater: false,
      problemShortDesc: '',
      coachId: this.connectedUserService.getCurrentUser().id,
      skillName: '',
      problem: '',
      remedy: '',
      outcome: '',
      deliver: false
    }
    this.navCtrl.push(CoachingImprovmentFeedbackEditPage, {
      feedback: feedback,
      feedbackIndex: -1,
      refereeIndex: this.currentRefereeIdx,
      readonly: this.readonly,
      callback :  this.callbackFeedback.bind(this),
      referees :  this.coaching.referees.map((ref) => ref.refereeShortName)
    });
  }

  public deleteFeedback(idx:number) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you want to delete the feedback ' + this.coaching.referees[this.currentRefereeIdx].feedbacks[idx].problemShortDesc + ' ?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            console.log("Deleting feedback.")
            this.coaching.referees[this.currentRefereeIdx].feedbacks.splice(idx, 1);
            this.saveCoaching();
          } 
        }
      ]
    });
    alert.present();
  }

  public deliverFeedback(feedback: Feedback, feedbackIndex: number) {
    feedback.deliver = !feedback.deliver;
    this.saveCoaching();
  }

  public selectFeedback(feedback: Feedback, idx:number) {
    this.navCtrl.push(CoachingImprovmentFeedbackEditPage, 
      { 
        feedback: feedback,
        feedbackIndex: idx, 
        refereeIndex: this.currentRefereeIdx,
        readonly: this.readonly,
        callback :  this.callbackFeedback.bind(this),
        referees : this.coaching.referees.map((ref) => ref.refereeShortName),
      });
  }

  public callbackFeedback(feedback:Feedback, refereeIndex: number = this.currentRefereeIdx, feedbackIndex:number = -1) {
    if (this.readonly) { return }
    if (feedback.problemShortDesc.length == 0) {
      if (feedbackIndex >= 0) {
        console.log('Remove feedback \'', feedback.problemShortDesc, '\'/', feedbackIndex, 
          ' of the referee ', this.coaching.referees[refereeIndex].refereeShortName);
        //remove it
        this.coaching.referees[refereeIndex].feedbacks.splice(feedbackIndex, 1);
        // save the coaching
        this.saveCoaching();
      }
    } else {
      //make sure fields are not enmpty
      feedback.skillName = this.makeNotEmpty(feedback.skillName, '-');
      feedback.problem = this.makeNotEmpty(feedback.problem, feedback.problemShortDesc);
      feedback.remedy = this.makeNotEmpty(feedback.remedy, '-');
      feedback.outcome = this.makeNotEmpty(feedback.outcome, '-');
      
      if (feedbackIndex >= 0) {
        console.log('Update feedback \'', feedback.problemShortDesc, '\/', feedbackIndex, 
          ' of the referee ', this.coaching.referees[refereeIndex].refereeShortName);
        // update it
        this.coaching.referees[refereeIndex].feedbacks[feedbackIndex] = feedback;
      } else {
        console.log('Add feedback \'', feedback.problemShortDesc, '\/', feedbackIndex, 
          ' of the referee ', this.coaching.referees[refereeIndex].refereeShortName);
        // add it
        this.coaching.referees[refereeIndex].feedbacks.push(feedback);
      }
      // save the coaching
      this.saveCoaching();
    }
  }

  makeNotEmpty(value:string, defaultValue:string):string {
    return value && value.trim().length > 0 ?  value : defaultValue;
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