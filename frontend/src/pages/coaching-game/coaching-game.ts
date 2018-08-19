import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { EmailService }                       from '../../app/service/EmailService';
import { ConnectedUserService }               from '../../app/service/ConnectedUserService';
import { RefereeService }                     from '../../app/service/RefereeService';
import { UserService }                        from '../../app/service/UserService';
import { ResponseWithData }                   from '../../app/service/response';
import { CoachingService }                    from '../../app/service/CoachingService';
import { Referee }                            from '../../app/model/user';
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

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public coachingService: CoachingService,
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public refereeService: RefereeService,
    public alertCtrl: AlertController,
    private emailService: EmailService) {
  }

  ionViewDidLoad() {
    this.loadCoaching().subscribe((response: ResponseWithData<Coaching>) => {
        this.coaching = response.data; 
        this.loadingReferees();
    });
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

  refereeSelected(refereeIndex: number) {
    this.currentRefereeIdx = refereeIndex;
    this.currentReferee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
  }

  lookingForUpgrade():boolean {
    const ref:Referee = this.id2referee.get(this.coaching.referees[this.currentRefereeIdx].refereeId);
    if (ref) {
      const res:boolean = ref && ref.referee.nextRefereeLevel && ref.referee.nextRefereeLevel != null;
      console.log('lookingForUpgrade ', this.coaching.referees[this.currentRefereeIdx].refereeShortName, res, ref.referee.nextRefereeLevel);
      return res;
      } else {
        console.log('lookingForUpgrade: referee not found !')
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
        callback :  this.callbackPositiveFeedback.bind(this) 
      });
  }

  public callbackPositiveFeedback(feedback:PositiveFeedback, index:number = -1) {
    if (feedback.skillName.length == 0) {
      if (index >= 0) {
        //remove it
        this.coaching.referees[this.currentRefereeIdx].positiveFeedbacks.splice(index, 1);
        // save the coaching
        this.saveCoaching();
      }
    } else {
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
      callback :  this.callbackFeedback.bind(this),
      referees : [
        this.coaching.referees[0].refereeShortName,
        this.coaching.referees[1].refereeShortName,
        this.coaching.referees[2].refereeShortName
      ]
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
        callback :  this.callbackFeedback.bind(this),
        referees : [
          this.coaching.referees[0].refereeShortName,
          this.coaching.referees[1].refereeShortName,
          this.coaching.referees[2].refereeShortName
        ],
      });
  }

  public callbackFeedback(feedback:Feedback, refereeIndex: number = this.currentRefereeIdx, feedbackIndex:number = -1) {
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

  sendCoaching() {
    this.emailService.sendEmail({
      to: this.connectedUserService.getCurrentUser().email,
      subject: this.coachingService.coachingAsEmailSubject(this.coaching),
      body: this.coachingService.coachingAsEmailBody(this.coaching),
      isHtml: true
    });
  }
}