import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ResponseWithData }             from '../../app/service/response';
import { PROService }                   from '../../app/service/PROService';
import { ConnectedUserService }         from '../../app/service/ConnectedUserService';
import { PRO, Feedback, PersistentPRO } from '../../app/model/coaching';

/**
 * Generated class for the CoachingImprovmentFeedbackEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-coaching-improvment-feedback-edit',
  templateUrl: 'coaching-improvment-feedback-edit.html',
})
export class CoachingImprovmentFeedbackEditPage {

  feedback: Feedback;
  feedbackIndex: number;
  callback:any;
  referees: string[];
  refereeIndex:number;

  searchInput:string;
  showProList: boolean = false;
  pros: PRO[];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public connectedUserService: ConnectedUserService,
    public proService: PROService,
    public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CoachingImprovmentFeedbackEditPage');
    this.feedback = this.navParams.get('feedback');
    this.feedbackIndex = this.navParams.get('feedbackIndex');
    this.callback = this.navParams.get('callback');
    this.referees = this.navParams.get('referees');
    this.refereeIndex = this.navParams.get('refereeIndex');
  }
  
  ionViewWillLeave() {
    if (this.callback && this.feedback.problemShortDesc) {
      this.callback(this.feedback, this.refereeIndex, this.feedbackIndex);
    }
  }

  onSearchBarInput($event) {
    if (this.searchInput && this.searchInput.trim().length > 0) {
      this.proService.searchPros(this.searchInput).subscribe((response: ResponseWithData<PersistentPRO[]>) => {
        this.pros = response.data;
        this.showProList = this.pros && this.pros.length > 0;
        if (!this.showProList) {
          this.feedback.problemShortDesc = this.searchInput
        }
      });
    } else {
      this.pros = null;
      this.showProList = false;
    }
  }

  proSelected($event, pro) {
    this.feedback.skillName = pro.skillName,
    this.feedback.problem = pro.problem;
    this.feedback.problemShortDesc = pro.problemShortDesc;
    this.feedback.remedy = pro.remedy;
    this.feedback.outcome = pro.outcome;
    this.showProList = false;
  }

  newPro(event=null) {
    let pro: PersistentPRO = {
      id: 0,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      coachId: this.connectedUserService.getCurrentUser().id,
      skillName: this.feedback.skillName,
      problem: this.feedback.problem,
      problemShortDesc: this.feedback.problemShortDesc,
      remedy: this.feedback.remedy,
      outcome: this.feedback.outcome
    }
    this.proService.save(pro).subscribe()
  }

  getOtherReferees(): string[] {
    return this.referees.filter((ref,idx) => {
      //console.log('idx= ', idx, ' refereeIndex=', this.refereeIndex);
      return ref && ref.length > 0 && idx != this.refereeIndex;
    });
  }
  copyFeedbackToAnotherReferee() {
    let otherReferees:string[] = this.getOtherReferees();
    let alert = this.alertCtrl.create();
    alert.setTitle('Choose the other referees');
    otherReferees.forEach(refShortName => {
      alert.addInput({ type: 'checkbox', label: refShortName, value: refShortName, checked: true }); 
    });
    alert.addButton('Cancel');
    alert.addButton({
      text: 'Add',
      handler: (data: string[]) => {
        console.log('Radio data:', data);
        data.forEach(refShortName => {
          const otherRefereeIndex:number = this.referees.indexOf(refShortName);
          if (otherRefereeIndex >= 0) {
            this.callback(this.feedback, otherRefereeIndex);
          }
        });
      }
    });
    alert.present();
  }
}
