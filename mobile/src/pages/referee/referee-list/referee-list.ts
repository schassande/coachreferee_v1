import { DateService } from 'src/app/service/DateService';
import { HelpService } from './../../../app/service/HelpService';
import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { RefereeEditPage } from '../referee-edit/referee-edit';
import { RefereeService } from '../../../app/service/RefereeService';
import { ResponseWithData } from '../../../app/service/response';
import { Referee } from '../../../app/model/user';

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
    private alertCtrl: AlertController,
    private dateService: DateService,
    private helpService: HelpService,
    public modalController: ModalController,
    private navController: NavController,
    public refereeService: RefereeService
    ) {
  }

  ngOnInit() {
    this.helpService.setHelp('referee-list');
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
  onSwipe(event) {
    // console.log('onSwipe', event);
    if (event.direction === 4) {
      this.navController.navigateRoot(`/home`);
    }
  }
  exportReferees() {
    this.refereeService.all().subscribe((rref) => {
      let content = 'firstName, lastName, shortName, country, email, gender, mobilePhones'
        + ', speakingLanguages, refereeLevel, refereeCategory, nextRefereeLevel\n';
      rref.data.forEach((ref) => {
        content += `${ref.firstName},${ref.lastName},${ref.shortName},${ref.country},${ref.email},${ref.firstName}`;
        content += `,${ref.gender},${ref.firstName},`;
        content += `"${ref.mobilePhones ? ref.mobilePhones : ''}"`;
        content += `,"${ref.speakingLanguages ? ref.speakingLanguages.join(',') : ''}"`;
        content += `,${ref.referee.refereeLevel},${ref.referee.refereeCategory}`;
        content += `,${ref.referee.nextRefereeLevel ? ref.referee.nextRefereeLevel : ''}\n`;
      });
      const oMyBlob = new Blob([content], {type : 'text/csv'});
      const url = URL.createObjectURL(oMyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CoachReferee_export_referees_${this.dateService.date2string(new Date())}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
  }
}
