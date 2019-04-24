import { AlertController, NavController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { ResponseWithData } from './../../app/service/response';
import { SkillProfileService } from '../../app/service/SkillProfileService';
import { SkillProfile } from './../../app/model/skill';

/**
 * Generated class for the SkillProfileListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-skill-profile-list',
  templateUrl: 'skill-profile-list.html',
})
export class SkillProfileListPage implements OnInit {

  skillProfiles: SkillProfile[];
  constructor(
    private navController: NavController,
    public skillProfileService: SkillProfileService,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.searchSkillProfile();
  }
  public newSkillProfile(): void {
    this.navController.navigateRoot('/skillprofile/create');
  }
  public skillProfileSelected(skillProfile: SkillProfile): void {
    this.navController.navigateRoot(`/skillprofile/${skillProfile.id}`);
  }
  private searchSkillProfile() {
    this.skillProfileService.all().subscribe((response: ResponseWithData<SkillProfile[]>) => {
      if (response.error && response.error.errorCode)  {
        console.error(response.error);
      }
      // console.log('searchSkillProfile: found ' + JSON.stringify(response, null, 2));
      this.skillProfiles = response.data;
    });
  }

  public deleteSkillProfile(skillProfile: SkillProfile) {
    this.alertCtrl.create({
      message: 'Do you really want to delete the skill profile ' + skillProfile.name +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            this.skillProfileService.delete(skillProfile.id).subscribe(() => this.searchSkillProfile());
          }
        }
      ]
    }).then( (alert) => alert.present());
  }
}
