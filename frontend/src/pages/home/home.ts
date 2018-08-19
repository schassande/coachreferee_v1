import { UserEditPage } from './../user-edit/user-edit';
import { ProListPage } from './../pro-list/pro-list';
import { CoachingListPage } from './../coaching-list/coaching-list';
import { User } from './../../app/model/user';
import { ResponseWithData } from './../../app/service/response';
import { UserService } from './../../app/service/UserService';
import { LocalAppSettings } from './../../app/model/settings';
import { AppSettingsService } from './../../app/service/AppSettingsService';
import { RefereeListPage } from './../referee-list/referee-list';
import { UserSelectionPage } from './../user-selection/user-selection';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { SettingsPage } from '../settings/settings';
import { SkillProfileListPage } from '../skill-profile-list/skill-profile-list';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  coachingNewPage = CoachingListPage;
  homePage = HomePage;
  refereeListPage = RefereeListPage;
  proPage = ProListPage;
  skillProfilePage = SkillProfileListPage;
  settingsPage = SettingsPage;
  userSelectionPage = UserSelectionPage;

  constructor(
    public navCtrl: NavController, 
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public appSettingsService: AppSettingsService) {
  }
  public getShortName(): String {
    return this.connectedUserService.isConnected() 
      ? '(' + this.connectedUserService.getCurrentUser().shortName + ')'
      : '';
  }
  ionViewDidLoad() {    
    this.autoLogin();
  }
  private autoLogin() {
    this.appSettingsService.get()
        .flatMap((settings: LocalAppSettings) => this.userService.get(settings.lastUserId))
        .map((ruser:ResponseWithData<User>) => {
            console.log('autologin: user=' + ruser.data);
            if (ruser.data) {
                this.connectedUserService.userConnected(ruser.data);
            }
        }).subscribe(() => {
          if (!this.connectedUserService.isConnected()) {
            console.log('autologin: no => search users');
            this.userService.all().subscribe((rusers:ResponseWithData<User[]>)=> {
              if (rusers.data && rusers.data.length > 0) {
                console.log('autologin: no => ask to select an user');
                this.navCtrl.push(UserSelectionPage);
              } else {
                console.log('autologin: no users => create an user');
                this.navCtrl.push(UserEditPage, {callback: this.callbackUserEdit.bind(this) });
              }
            })
          }
        }, (err) => console.error(err));
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
