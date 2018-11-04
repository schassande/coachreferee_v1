import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { Observable } from 'rxjs';

import { UserEditPage }         from './../user-edit/user-edit';
import { User }                 from '../../app/model/user';

import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ResponseWithData }     from './../../app/service/response';
import { SynchroService }       from './../../app/service/SynchroService';
import { UserService }          from './../../app/service/UserService';

/**
 * Generated class for the UserSelectionPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-user-selection',
  templateUrl: 'user-selection.html',
})
export class UserSelectionPage {

  users: User[];
  error;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public synchroService: SynchroService,
    public alertCtrl: AlertController) {}

  ionViewDidEnter() {
    this.loadUser();
  }
  loadUser() {
    //TODO this.users = this.navParams.get('users');
    if (!this.users) {
      this.userService.localAll()
      .flatMap((rusers:ResponseWithData<User[]>)=> {
        if (rusers.error && rusers.error.errorCode) {
          console.log('no local user => search remote users');
          return this.userService.all();
        } else {
          return Observable.of(rusers);
        }
      }).subscribe((response: ResponseWithData<User[]>) => {
        this.users = response.data;
        this.error = response.error;
        if (this.users == null || this.users.length == 0) {
          this.newUser();
        }
      });
    }
  }

  public userSelected(event: any, user: User): void {
    this.userService.localGet(user.id)
      .flatMap((response: ResponseWithData<User>) =>  response.data ? Observable.of(response) : this.userService.getByEmail(user.email))
      .map((response: ResponseWithData<User>) => response.data)
      .flatMap((user:User) => {
        return this.synchroService.isOnline().flatMap((online:boolean) => {
          if (online) {
            return this.userService.login(user.email, user.password)
          } else {
            this.connectedUserService.userConnected(user);
            return Observable.of({data: user, error:null});
          }
        });
      })
      .map(() => {
        this.navCtrl.pop();  
      })
      .subscribe();
  }

  public newUser(): void {
    this.navCtrl.push(UserEditPage);
  }
  
  public deleteUser(user: User) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you really want to delete user ' + user.firstName + ' ' + user.lastName +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            console.log('Deleting user ' + user.id + '...');
            this.userService.delete(user.id).subscribe(() => this.loadUser()); 
          } 
        }
      ]
    });
    alert.present();
  }
}
