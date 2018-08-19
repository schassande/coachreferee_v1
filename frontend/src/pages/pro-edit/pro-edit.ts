import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { Observable } from 'rxjs';
import { ResponseWithData } from './../../app/service/response';
import { PersistentPRO } from './../../app/model/coaching';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { PROService } from '../../app/service/PROService';

/**
 * Generated class for the ProEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-pro-edit',
  templateUrl: 'pro-edit.html',
})
export class ProEditPage {

  pro: PersistentPRO;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public proService: PROService,
    public connectedUserService: ConnectedUserService,
    public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.loadPRO().subscribe((response: ResponseWithData<PersistentPRO>) => {
      this.pro = response.data; 
      if (this.pro) {
      } else {
        this.initPRO();
      }
    });
    
  }
  private loadPRO():Observable<ResponseWithData<PersistentPRO>> {
    const pro:PersistentPRO = this.navParams.get('pro');
    const proId = this.navParams.get('proId');
    return (pro || !proId) 
      ? Observable.of({data : pro, error: null}) 
      :  this.proService.get(proId);
  }

  private initPRO() {
    this.pro = {
      id: 0,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      coachId: this.connectedUserService.getCurrentUser().id,
      skillName: '',
      problem: '',
      problemShortDesc: '',
      remedy: '',
      outcome: ''
    }
  }

  savePRO(event) {
    this.proService.save(this.pro).map((response: ResponseWithData<PersistentPRO>) => this.navCtrl.pop()).subscribe();
  }

  deletePRO(event) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete this PRO ' + this.pro.problemShortDesc +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.navCtrl.pop();
          } 
        }
      ]
    });
    alert.present();
  }
}
