import { ResponseWithData } from './../../app/service/response';
import { PROService } from './../../app/service/PROService';
import { PersistentPRO } from './../../app/model/coaching';
import { ProEditPage } from './../pro-edit/pro-edit';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

/**
 * Generated class for the ProListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-pro-list',
  templateUrl: 'pro-list.html',
})
export class ProListPage {

  pros : PersistentPRO[];
  searchInput: string;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public proService: PROService,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {
    this.searchPro();
  }

  public newPRO(): void {
    this.navCtrl.push(ProEditPage);
  }
  public proSelected(event: any, pro: PersistentPRO): void {
    this.navCtrl.push(ProEditPage, { id: pro.id, pro : pro });
  }
  public onSearchBarInput() {
    this.searchPro();
  }
  private searchPro() {
    this.proService.searchPros(this.searchInput).subscribe((response: ResponseWithData<PersistentPRO[]>) => {
      this.pros = response.data;
    });
  }
  public deletePRO(pro: PersistentPRO) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete the coaching ' + pro.problemShortDesc +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.proService.delete(pro.id).subscribe(() => this.searchPro()); 
          } 
        }
      ]
    });
    alert.present();
  }
}
