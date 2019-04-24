import { AlertController, NavController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { flatMap, map } from 'rxjs/operators';
import { of } from 'rxjs';

import { User } from '../../app/model/user';

import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ResponseWithData } from './../../app/service/response';
import { SynchroService } from './../../app/service/SynchroService';
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
    public synchroService: SynchroService,
    public alertCtrl: AlertController) {}

    ngOnInit() {
    this.loadUser();
  }
  loadUser() {
      this.userService.localAll().pipe(
        flatMap((rusers: ResponseWithData<User[]>) => {
          if (rusers.error && rusers.error.errorCode) {
            console.log('no local user => search remote users');
            return this.userService.all();
          } else {
            return of(rusers);
          }
        })
      ).subscribe((response: ResponseWithData<User[]>) => {
        this.users = response.data;
        this.error = response.error;
        if (this.users == null || this.users.length === 0) {
          this.newUser();
        }
      });
  }

  public userSelected(userSelected: User): void {
    this.userService.localGet(userSelected.id).pipe(
      flatMap((response: ResponseWithData<User>) =>  response.data ? of(response) : this.userService.getByEmail(userSelected.email)),
      map((response: ResponseWithData<User>) => response.data),
      flatMap((user: User) => {
        return this.synchroService.isOnline().pipe(flatMap((online: boolean) => {
          if (online) {
            return this.userService.login(user.email, user.password);
          } else {
            this.connectedUserService.userConnected(user);
            return of({data: user, error: null});
          }
        }));
      }),
      map(() => {
        this.navController.navigateRoot('/home');
      }))
      .subscribe();
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
            this.userService.delete(user.id).subscribe(() => this.loadUser());
          }
        }
      ]
    }).then ( (alert) => alert.present());
  }
}
