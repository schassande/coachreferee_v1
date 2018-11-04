import { UserService } from './UserService';
import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { Injectable, EventEmitter } from '@angular/core';
import { RequestOptions, Headers } from '@angular/http';
import { NavController } from 'ionic-angular';
import { User } from './../model/user';


@Injectable()
export class ConnectedUserService {

  /** The current user */
  private currentUser: User = null;

  /** The event about user connection */
  public $userConnectionEvent: EventEmitter<User> = new EventEmitter<User>();

  constructor(
      public appSettingsService:  AppSettingsService) {
  }

  public getRequestOptions(las:LocalAppSettings): RequestOptions {
      const headers: any = { 'Content-Type': 'application/json', version: '1.0'};
      if (this.currentUser && this.currentUser.token) {
        headers['authorization'] = this.currentUser.token;
      }
      headers['x-api-key'] = las.apiKey;
      return new RequestOptions({ headers: new Headers(headers) });
  }
  
  public isConnected(): boolean {
    return this.currentUser && this.currentUser !== null;
  }
  public isLogin(): boolean {
    return this.currentUser && this.currentUser !== null 
      && this.currentUser.token && this.currentUser.token != null;
  }
  public getCurrentUser(): User {
    return this.currentUser;
  }

  public userConnected(user: User) {
    this.currentUser = user;
    this.appSettingsService.setLastUser(user);
    console.log('User connected: ' + this.currentUser.id);
    this.$userConnectionEvent.emit(this.currentUser);
  }
  public userDisconnected() {
    this.currentUser = null;
    console.log('User disconnected.');
    this.$userConnectionEvent.emit(this.currentUser);
  }

  public navBackOrRoot(navCtrl: NavController) {
    if (navCtrl.length() > 1) {
      navCtrl.pop();
    } else {
      navCtrl.goToRoot({});
    }
  }    
}