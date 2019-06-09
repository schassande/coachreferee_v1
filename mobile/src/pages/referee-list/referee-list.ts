import { AlertController, ModalController, NavController } from '@ionic/angular';
import { RefereeEditPage } from './../referee-edit/referee-edit';
import { RefereeService } from './../../app/service/RefereeService';
import { Referee } from './../../app/model/user';
import { ResponseWithData } from './../../app/service/response';
import { Component, OnInit } from '@angular/core';

/**
 * Generated class for the RefereeListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-referee-list',
  templateUrl: 'referee-list.html',
})
export class RefereeListPage implements OnInit {

  referees: Referee[];
  error: any;
  searchInput: string;
  sortBy: string;

  constructor(
    public modalController: ModalController,
    private navController: NavController,
    public refereeService: RefereeService,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.searchReferee();
  }

  private searchReferee() {
    this.refereeService.searchReferees(this.searchInput).subscribe((response: ResponseWithData<Referee[]>) => {
      this.referees = this.sortReferees(response.data);
      this.error = response.error;
    });
  }
  private sortReferees(referees: Referee[]): Referee[] {
    if (!referees) {
      return referees;
    }
    if (this.sortBy === 'level') {
      return referees.sort((ref1: Referee, ref2: Referee) => {
        let res = 0;
        if (res === 0) {
          res = ref1.referee.refereeLevel.localeCompare(ref2.referee.refereeLevel);
        }
        if (res === 0) {
            res = ref1.shortName.localeCompare(ref2.shortName);
        }
        return res;
      });
    } else {
      return referees.sort((ref1: Referee, ref2: Referee) => ref1.shortName.localeCompare(ref2.shortName));
    }
  }

  public refereeSelected(event: any, referee: Referee): void {
    this.navController.navigateRoot(`/referee/view/${referee.id}`);
  }

  public async newReferee() {
    const modal = await this.modalController.create({ component: RefereeEditPage});
    modal.onDidDismiss().then( (data) => this.searchReferee());
    return await modal.present();
  }

  public onSearchBarInput() {
    this.searchReferee();
  }

  public deleteReferee(referee: Referee) {
    this.alertCtrl.create({
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
    }).then( (alert) => alert.present());
  }
}
