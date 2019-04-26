import { Component, OnInit } from '@angular/core';
import { ActivatedRoute} from '@angular/router';
import { AlertController, NavController } from '@ionic/angular';
import { Observable, of } from 'rxjs';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ResponseWithData } from './../../app/service/response';
import { PersistentPRO } from './../../app/model/coaching';
import { PROService } from '../../app/service/PROService';
import { flatMap, map } from 'rxjs/operators';

/**
 * Generated class for the ProEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-pro-edit',
  templateUrl: 'pro-edit.html',
})
export class ProEditPage implements OnInit {

  pro: PersistentPRO;

  constructor(
    private route: ActivatedRoute,
    private navController: NavController,
    public proService: PROService,
    public connectedUserService: ConnectedUserService,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.loadPRO().subscribe();
  }

  private loadPRO(): Observable<PersistentPRO> {
    return this.route.paramMap.pipe(
      flatMap( (paramMap) => {
        const proId: string  = paramMap.get('id');
        if (proId !== null) {
          return this.proService.get(proId);
        } else {
          return of({
            data : {
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
            },
            error: null
          });
        }
      }),
      map( (response: ResponseWithData<PersistentPRO>) => {
        this.pro = response.data;
        return this.pro;
      })
    );
  }

  savePRO() {
    this.proService.save(this.pro).pipe(map(() => this.leave())).subscribe();
  }

  deletePRO() {
    this.alertCtrl.create({
      header: 'Confirm Deletion',
      message: 'Do you really want to delete this PRO ' + this.pro.problemShortDesc +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { text: 'Delete', handler: () => this.leave() }
      ]
    }).then( (alert) => alert.present());
  }

  leave() {
    this.navController.navigateRoot('/pro/list');
  }
}
