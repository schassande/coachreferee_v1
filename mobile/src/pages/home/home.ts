import { BookmarkService } from './../../app/service/BookmarkService';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { AppSettingsService } from './../../app/service/AppSettingsService';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { UserService } from './../../app/service/UserService';

import { User } from './../../app/model/user';
import { LocalAppSettings } from './../../app/model/settings';
import { ResponseWithData } from './../../app/service/response';
import { flatMap, map } from 'rxjs/operators';
import { NavController, AlertController } from '@ionic/angular';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  styleUrls: ['home.scss']
})
export class HomePage implements OnInit {

  connected = false;
  showInstallBtn = false;
  deferredPrompt;

  constructor(
      private navController: NavController,
      private userService: UserService,
      private connectedUserService: ConnectedUserService,
      private appSettingsService: AppSettingsService,
      private alertCtrl: AlertController,
      private bookmarkService: BookmarkService,
      private changeDetectorRef: ChangeDetectorRef) {
    this.connectedUserService.$userConnectionEvent.subscribe((user: User) => {
      this.connected = user != null;
      this.changeDetectorRef.detectChanges();
      this.bookmarkService.addBookmarkEntry({
        id: 'logout',
        label: 'Logout',
        url: '/user/logout'});
      });
  }
  public getShortName(): string {
    return this.connected
      ? this.connectedUserService.getCurrentUser().shortName
      : '';
  }

  ngOnInit() {
    console.log('Home.ionViewDidLoad()');
    this.connected = this.connectedUserService.isConnected();
    if (!this.connected) {
      this.tryToAutoLogin();
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later on the button event.
      this.deferredPrompt = e;
    // Update UI by showing a button to notify the user they can add to home screen
      this.showInstallBtn = true;
    });
    window.addEventListener('appinstalled', (event) => console.log('App installed'));
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('display-mode is standalone');
    }
  }
  addToHome() {
    // hide our user interface that shows our button
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the prompt');
        } else {
          console.log('User dismissed the prompt');
        }
        this.deferredPrompt = null;
      });
  }

  private tryToAutoLogin() {
    // get last user connection info from the application settings store on device
    this.appSettingsService.get().pipe(
      flatMap((settings: LocalAppSettings) => {
        return this.userService.autoLogin(settings.lastUserEmail, settings.lastUserPassword);
      }),
      map(() => {
        if (!this.connectedUserService.isConnected()) {
          this.autoLoginNotPossible();
        }
      })
    ).subscribe();
  }

  private autoLoginNotPossible() {
    console.log('autologin: no => search users');
    this.userService.all().pipe(
      map((rusers: ResponseWithData<User[]>) => {
        if (rusers.data && rusers.data.length > 0) {
          console.log('autologin: Ask to select an user: ', rusers.data);
          this.navController.navigateRoot('/user/select');
        } else {
          console.log('autologin: no users => create an user');
          this.alertCtrl.create({
            message: 'Welcome to RefCoach app !<br>You have to create an account to use the application.',
            buttons: [ { text: 'Ok', handler: () => this.navController.navigateRoot('/user/create') } ]
          }).then( (alert) => alert.present() );
        }
      })
    ).subscribe();
  }

  public gotToMyAccount() {
    if (this.connectedUserService.isConnected()) {
      this.navController.navigateRoot(`/user/edit/${this.connectedUserService.getCurrentUser().id}`);
    }
  }
}
