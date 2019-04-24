import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { RefereeEditPage } from './../referee-edit/referee-edit';
import { ResponseWithData } from './../../app/service/response';
import { RefereeService } from './../../app/service/RefereeService';
import { Component, OnInit } from '@angular/core';
import { Referee } from '../../app/model/user';

/**
 * Generated class for the RefereeSelectPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-referee-select',
  templateUrl: 'referee-select.html',
})
export class RefereeSelectPage implements OnInit {

  referees: Referee[];
  error: any;
  searchInput: string;

  constructor(
    public refereeService: RefereeService,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.searchReferee();
  }

  private searchReferee() {
    this.refereeService.searchReferees(this.searchInput).subscribe((response: ResponseWithData<Referee[]>) => {
      this.referees = response.data;
      this.error = response.error;
    });
  }

  public refereeSelected(referee: Referee): void {
    console.log('refereeSelected', referee);
    this.refereeService.lastSelectedReferee.referee = referee;
    this.modalCtrl.dismiss( { referee});
  }

  public newReferee(): void {
    this.modalCtrl.create({ component: RefereeEditPage })
      .then( (modal) => modal.present() );
  }

  public onSearchBarInput() {
    this.searchReferee();
  }

  public deleteReferee(referee: Referee) {
    this.alertCtrl.create({
      // title: 'Confirm Deletion',
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
    }).then((alert) => alert.present());
  }
}
