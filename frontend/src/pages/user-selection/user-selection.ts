import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { UserEditPage } from './../user-edit/user-edit';
import { UserService } from './../../app/service/UserService';
import { ResponseWithData } from './../../app/service/response';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { User } from '../../app/model/user';

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
    public alertCtrl: AlertController) {}

  ionViewDidEnter() {
    this.loadUser();
  }
  loadUser() {
    this.userService.all().subscribe((response: ResponseWithData<User[]>) => {
      this.users = response.data;
      this.error = response.error;
      if (this.users == null || this.users.length == 0) {
        this.newUser();
      }
    });
  }

  public userSelected(event: any, user: User): void {
    this.connectedUserService.userConnected(user);
    this.navCtrl.pop();
  }

  public newUser(): void {
    this.navCtrl.push(UserEditPage);
  }
  
  public deleteUser(user: User) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete user ' + user.firstName + ' ' + user.lastName +  '?',
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
