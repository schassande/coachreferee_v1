import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { ResponseWithData } from './../../app/service/response';
import { PROService } from './../../app/service/PROService';
import { PersistentPRO } from './../../app/model/coaching';

/**
 * Generated class for the ProListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-pro-list',
  templateUrl: 'pro-list.html',
})
export class ProListPage implements OnInit {

  pros: PersistentPRO[];
  searchInput: string;

  constructor(
    private navController: NavController,
    public proService: PROService,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.searchPro();
  }

  public home(): void {
    this.navController.navigateRoot(`/home`);
  }

  public newPRO(): void {
    this.navController.navigateRoot(`/pro/edit/-1`);
  }
  public proSelected(event: any, pro: PersistentPRO): void {
    this.navController.navigateRoot(`/pro/edit/${pro.id}`);
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
    this.alertCtrl.create({
      header: 'Confirm Deletion',
      message: 'Do you really want to delete the PRO ' + pro.problemShortDesc +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            this.proService.delete(pro.id).subscribe(() => this.searchPro());
          }
        }
      ]
    }).then( (alert) => alert.present());
  }
}
