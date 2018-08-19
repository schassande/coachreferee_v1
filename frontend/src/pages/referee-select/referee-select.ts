import { RefereeEditPage } from './../referee-edit/referee-edit';
import { ResponseWithData } from './../../app/service/response';
import { AlertController } from 'ionic-angular';
import { RefereeService } from './../../app/service/RefereeService';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Referee } from '../../app/model/user';

/**
 * Generated class for the RefereeSelectPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-referee-select',
  templateUrl: 'referee-select.html',
})
export class RefereeSelectPage {

  referees: Referee[];
  error: any;
  searchInput: string;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public refereeService: RefereeService,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {
    this.searchReferee();
  }

  private searchReferee() {
    this.refereeService.searchReferees(this.searchInput).subscribe((response: ResponseWithData<Referee[]>) => {
      this.referees = response.data;
      this.error = response.error;
    });
  }

  public refereeSelected(event: any, referee: Referee): void {
    const callback = this.navParams.get("callback");
    if (callback) {
      callback(referee);
    }
    this.navCtrl.pop();
  }

  public newReferee(): void {
    this.navCtrl.push(RefereeEditPage);
  }

  public onSearchBarInput() {
    this.searchReferee();
  }
  
  public deleteReferee(referee: Referee) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete the referee ' + referee.firstName + ' ' + referee.lastName +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.refereeService.delete(referee.id).subscribe(() => this.searchReferee()); 
          } 
        }
      ]
    });
    alert.present();
  }
}
