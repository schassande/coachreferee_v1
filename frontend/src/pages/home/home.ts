import { Observable } from 'rxjs';
import { Component }              from '@angular/core';
import { NavController }          from 'ionic-angular';

import { AppSettingsService }     from './../../app/service/AppSettingsService';
import { ConnectedUserService }   from './../../app/service/ConnectedUserService';
import { SynchroService }         from './../../app/service/SynchroService';
import { UserService }            from './../../app/service/UserService';

import { User }                   from './../../app/model/user';

import { CoachingListPage }       from './../coaching-list/coaching-list';
import { LocalAppSettings }       from './../../app/model/settings';
import { ProListPage }            from './../pro-list/pro-list';
import { RefereeListPage }        from './../referee-list/referee-list';
import { ResponseWithData }       from './../../app/service/response';
import { UserEditPage }           from './../user-edit/user-edit';
import { UserSelectionPage }      from './../user-selection/user-selection';
import { SettingsPage }           from '../settings/settings';
import { SkillProfileListPage }   from '../skill-profile-list/skill-profile-list';
import { AssessmentListPage }     from '../assessment-list/assessment-list';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  coachingNewPage = CoachingListPage;
  homePage = HomePage;
  assessmentListPage = AssessmentListPage;
  refereeListPage = RefereeListPage;
  proPage = ProListPage;
  skillProfilePage = SkillProfileListPage;
  settingsPage = SettingsPage;
  userSelectionPage = UserSelectionPage;

  connected: boolean = false;

  constructor(
      public navCtrl: NavController, 
      public userService: UserService,
      public connectedUserService: ConnectedUserService,
      public synchroService: SynchroService,
      public appSettingsService: AppSettingsService) {
    this.connectedUserService.$userConnectionEvent.subscribe((user:User) =>{
      this.connected = user != null;
    });
  }
  public getShortName(): String {
    return this.connected 
      ? this.connectedUserService.getCurrentUser().shortName
      : '';
  }
  ionViewDidLoad() {    
    this.autoLogin();
  }
  private autoLogin() {
    this.synchroService.tryToSynchronize(false, this.userService.getLocalStoragePrefix())
    .flatMap( () => this.appSettingsService.get())
    .flatMap((settings: LocalAppSettings) => this.userService.localGet(settings.lastUserId))
    .flatMap((ruser:ResponseWithData<User>) => {
        return this.synchroService.isOnline().flatMap((online:boolean) => {
          if (ruser.data) {
            console.log('autologin: user=' + ruser.data.email);
            if (online) {
              console.log('autologin: login with server');
              return this.userService.login(ruser.data.email, ruser.data.password)
                .flatMap((rlogin) => {
                  if (rlogin.error) {
                    console.log('user does not exist try to save him');
                    return this.userService.save(ruser.data);
                  } else {
                    return Observable.of(rlogin);
                  }
                });
            } else {
              console.log('autologin: local connection');
              this.connectedUserService.userConnected(ruser.data);
              return Observable.of(null);
            }
          } else {
            console.log('autologin: no => search local users');
            return this.userService.localAll()
              .flatMap((rusers:ResponseWithData<User[]>)=> {
                if (online && rusers.error && rusers.error.errorCode) {
                  console.log('autologin: no local user => search remote users');
                  return this.userService.all();
                } else {
                  return Observable.of(rusers);
                }
              })
              .map((rusers:ResponseWithData<User[]>)=> {
                console.log('autologin: rusers=' + JSON.stringify(rusers));
                if (rusers.data && rusers.data.length > 0) {
                  console.log('autologin: Ask to select an user');
                  this.navCtrl.push(UserSelectionPage, { users: rusers});
                } else {
                  console.log('autologin: no users => create an user');
                  this.navCtrl.push(UserEditPage, {callback: this.callbackUserEdit.bind(this) });

                }
              }).map(() => null);
        }
        })
      }).subscribe(null, (err) => console.error(err));
  }

  public callbackUserEdit(user: User) {
    if (user && user.id) {
      this.connectedUserService.userConnected(user);
    }
  }

  public gotToMyAccount() {
    if (this.connectedUserService.isConnected()) {
      this.navCtrl.push(UserEditPage, 
        { 
          user : this.connectedUserService.getCurrentUser(), 
          userId: this.connectedUserService.getCurrentUser().id 
        });
    }    
  }
}
