import { of } from 'rxjs';
import { Component, OnInit } from '@angular/core';

import { AppSettingsService } from './../../app/service/AppSettingsService';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { SynchroService } from './../../app/service/SynchroService';
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
      public userService: UserService,
      public connectedUserService: ConnectedUserService,
      public synchroService: SynchroService,
      public appSettingsService: AppSettingsService,
      public alertCtrl: AlertController) {
    this.connectedUserService.$userConnectionEvent.subscribe((user: User) => {
      this.connected = user != null;
    });
  }
  public getShortName(): string {
    return this.connected
      ? this.connectedUserService.getCurrentUser().shortName
      : '';
  }

  ngOnInit() {
    console.log('Home.ionViewDidLoad()');
    this.autoLogin();
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
  private autoLogin() {
    this.synchroService.tryToSynchronize(false, this.userService.getLocalStoragePrefix()).pipe(
      flatMap( () => this.appSettingsService.get()),
      flatMap((settings: LocalAppSettings) => this.userService.localGet(settings.lastUserId)),
      flatMap((ruser: ResponseWithData<User>) => {
        return this.synchroService.isOnline().pipe(flatMap((online: boolean) => {
          if (ruser.data) {
            console.log('autologin: user=' + ruser.data.email);
            if (online) {
              console.log('autologin: login with server');
              return this.userService.login(ruser.data.email, ruser.data.password)
                .pipe(flatMap((rlogin) => {
                  if (rlogin.error) {
                    console.log('user does not exist try to save him');
                    return this.userService.save(ruser.data);
                  } else {
                    return of(rlogin);
                  }
                }));
            } else {
              console.log('autologin: local connection');
              this.connectedUserService.userConnected(ruser.data);
              return of('');
            }
          } else {
            console.log('autologin: no => search local users');
            return this.userService.localAll().pipe(
              flatMap((rusers: ResponseWithData<User[]>) => {
                if (online && rusers.error && rusers.error.errorCode) {
                  console.log('autologin: no local user => search remote users');
                  return this.userService.all();
                } else {
                  return of(rusers);
                }
              }),
              map((rusers: ResponseWithData<User[]>) => {
                console.log('autologin: rusers=' + JSON.stringify(rusers));
                if (rusers.data && rusers.data.length > 0) {
                  console.log('autologin: Ask to select an user');
                  this.navController.navigateRoot('/user/select');
                } else {
                  console.log('autologin: no users => create an user');
                  this.alertCtrl.create({
                    message: 'Welcome to RefCoach app !<br>You have to create an account to use the application.',
                    buttons: [ { text: 'Ok', handler: () => this.navController.navigateRoot('/user/create') } ]
                  }).then( (alert) => alert.present() );
                }
              }),
              map(() => null));
            }
        }));
      })).subscribe(null, (err) => console.error(err));
  }

  public callbackUserEdit(user: User) {
    if (user && user.id) {
      this.connectedUserService.userConnected(user);
    }
  }

  public gotToMyAccount() {
    if (this.connectedUserService.isConnected()) {
      this.navController.navigateRoot(`/user/edit/${this.connectedUserService.getCurrentUser().id}`);
    }
  }
}
