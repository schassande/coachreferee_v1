import { CoachingService } from './../../app/service/CoachingService';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the CompetitionListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
export interface Competition {
  name: string;
  begin: Date;
}
@IonicPage()
@Component({
  selector: 'page-competition-list',
  templateUrl: 'competition-list.html',
})
export class CompetitionListPage {

  competitions: Competition[];
  error;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public coachingService: CoachingService) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CompetitionListPage');
  }
}
