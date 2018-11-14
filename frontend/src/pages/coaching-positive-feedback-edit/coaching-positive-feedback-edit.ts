import { PositiveFeedback } from './../../app/model/coaching';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the CoachingPositiveFeedbackEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-coaching-positive-feedback-edit',
  templateUrl: 'coaching-positive-feedback-edit.html',
})
export class CoachingPositiveFeedbackEditPage {

  feedback:PositiveFeedback;
  index:number= -1;
  callback:any;
  readonly:boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    this.feedback = this.navParams.get('feedback');
    this.index = this.navParams.get('index');
    this.callback = this.navParams.get('callback');
    this.readonly = this.navParams.get('readonly');
  }
  
  ionViewWillLeave() {
    if (this.callback && this.feedback.skillName) {
      this.callback(this.feedback, this.index);
    }
  }
}
