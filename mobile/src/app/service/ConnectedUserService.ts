import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { Injectable, EventEmitter } from '@angular/core';
import { User } from './../model/user';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable()
export class ConnectedUserService {

  /** The current user */
  private currentUser: User = null;

  /** The event about user connection */
  public $userConnectionEvent: EventEmitter<User> = new EventEmitter<User>();

  constructor(
      public appSettingsService: AppSettingsService) {
  }

  public getRequestOptions(las: LocalAppSettings): {
        headers?: HttpHeaders | {
            [header: string]: string | string[];
        };
        observe?: 'body';
        params?: HttpParams | {
            [param: string]: string | string[];
        };
        reportProgress?: boolean;
        responseType?: 'json';
        withCredentials?: boolean;
    } {
      const headers: any = {
        'Content-Type': 'application/json',
        version: '1.0',
        'x-api-key': las.apiKey
      };
      if (this.currentUser && this.currentUser.token) {
        headers.authorization = this.currentUser.token;
      }
      return { headers : new HttpHeaders(headers), observe: 'body', responseType: 'json' };
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
}
