import { AlertController, NavController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { flatMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { User } from '../../app/model/user';

import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ResponseWithData } from './../../app/service/response';
import { UserService } from './../../app/service/UserService';

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
export class UserSelectionPage implements OnInit {

  users: User[];
  error;

  constructor(
    private navController: NavController,
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public alertCtrl: AlertController) {}

  ngOnInit() {
    this.loadUser();
  }

  loadUser() {
    this.userService.all().subscribe((response: ResponseWithData<User[]>) => {
      this.users = response.data;
      this.error = response.error;
      if (this.users == null || this.users.length === 0) {
        this.newUser();
      }
    });
  }

  public userSelected(user: User): void {
    this.userService.autoLogin(user.email, null).pipe(
      map( (ruser) => {
        if (ruser.data) {
          // login with success
          this.navController.navigateRoot('/home');
        } // else login failed
      })
    ).subscribe();
  }

  public newUser(): void {
    this.navController.navigateRoot('/user/create');
  }

  public deleteUser(user: User) {
    this.alertCtrl.create({
      message: 'Do you really want to delete user ' + user.firstName + ' ' + user.lastName +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            console.log('Deleting user ' + user.id + '...');
            this.userService.delete(user.id).subscribe(
              (data) => {
                this.loadUser();
                console.log('user deleted', data);
              },
              (err) => console.log('Error on user deletion: ', err));
          }
        }
      ]
    }).then ( (alert) => alert.present());
  }
}
