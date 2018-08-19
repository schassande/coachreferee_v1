import { UserService } from './UserService';
import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { RequestOptions, Headers } from '@angular/http';
import { NavController } from 'ionic-angular';
import { User } from './../model/user';


@Injectable()
export class ConnectedUserService {
    
    constructor(
      public appSettingsService:  AppSettingsService) {
    }

    private currentUser: User = null;

    public getRequestOptions(): RequestOptions {
        const headers: any = { 'Content-Type': 'application/json', version: '1.0'};
        if (this.currentUser && this.currentUser.token) {
          headers['authorization'] = this.currentUser.token;
        }
        return new RequestOptions({ headers: new Headers(headers) });
    }
    
    public isConnected(): boolean {
      return this.currentUser && this.currentUser !== null;
    }
    public getCurrentUser(): User {
      return this.currentUser;
    }

    public userConnected(user: User) {
      this.currentUser = user;
      this.appSettingsService.setLastUser(user);
      console.log('User connected: ' + this.currentUser.id);
    }
    public userDisconnected() {
      this.currentUser = null;
    }

    public navBackOrRoot(navCtrl: NavController) {
      if (navCtrl.length() > 1) {
        navCtrl.pop();
      } else {
        navCtrl.goToRoot({});
      }
    }    
}