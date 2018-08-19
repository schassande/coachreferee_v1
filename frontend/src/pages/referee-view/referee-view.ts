import { RefereeEditPage } from './../referee-edit/referee-edit';
import { CoachingEditPage } from './../coaching-edit/coaching-edit';
import { EmailService } from './../../app/service/EmailService';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { CoachingService } from './../../app/service/CoachingService';
import { RefereeService } from './../../app/service/RefereeService';
import { Coaching } from './../../app/model/coaching';
import { ResponseWithData } from './../../app/service/response';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController } from 'ionic-angular';
import { Referee } from '../../app/model/user';

/**
 * Generated class for the RefereeViewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-referee-view',
  templateUrl: 'referee-view.html',
})
export class RefereeViewPage {
  referee: Referee;
  coachings: Coaching[];
  errorfindCoachings: any;
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public refereeService: RefereeService,
    public coachingService: CoachingService,
    public connectedUserService: ConnectedUserService,
    public loadingCtrl: LoadingController,
    public emailService: EmailService) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefereePage');
    const referee:Referee = this.navParams.get('referee');
    if (referee) {
      this.setReferee(referee);
    } else {
      const id = this.navParams.get('id');
      if (id) {
        this.setRefereeId(id);
      } else {
        this.connectedUserService.navBackOrRoot(this.navCtrl);
      }
    }
  }

  private setRefereeId(id: number) {
    console.log("RefereeView.setRefereeId(" + id + ")");
    this.refereeService.get(id).subscribe((response: ResponseWithData<Referee>) => {
      if (response.error) {
        const loader = this.loadingCtrl.create({
          content: "Problem to load referee informaion ...",
          duration: 3000
        });
        loader.present().then(() => {
          this.connectedUserService.navBackOrRoot(this.navCtrl);
        });
      } else {
        this.setReferee(response.data);
      }
    });
  }

  private setReferee(referee: Referee) {
    console.log("RefereeView.setReferee(" + referee + ")");
    this.referee = referee;
    this.coachingService.getCoachingByReferee(this.referee.id).subscribe((response: ResponseWithData<Coaching[]>) => {
      this.errorfindCoachings = response.error;
      this.coachings = response.data;
    });
  }
  public editReferee() {
    this.navCtrl.push(RefereeEditPage, {referee: this.referee, refereeId: this.referee.id });
  }
  coachingSelected(event, coaching:Coaching) {
    this.navCtrl.push(CoachingEditPage, { id: coaching.id, coaching: coaching });
  }

  sendCoachings() {
    let body: string = '';
    this.coachings.forEach((coaching: Coaching) => {
      body +=  '<h1>' + this.coachingService.coachingAsEmailSubject(coaching) + '</h1>' 
              + this.coachingService.coachingAsEmailBody(coaching);
    });
    this.emailService.sendEmail({
      to: this.connectedUserService.getCurrentUser().email,
      subject: `Coachings of the referee ${this.referee.firstName} ${this.referee.lastName} (${this.referee.shortName})`,
      body: body,
      isHtml: true
    });
  }
}
