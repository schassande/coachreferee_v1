import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ResponseWithData }       from './../../app/service/response';
import { SkillProfileService }    from '../../app/service/SkillProfileService';
import { SkillProfileEditPage }   from '../skill-profile-edit/skill-profile-edit';
import { SkillProfile }           from './../../app/model/skill';

/**
 * Generated class for the SkillProfileListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-skill-profile-list',
  templateUrl: 'skill-profile-list.html',
})
export class SkillProfileListPage {

  skillProfiles: SkillProfile[];
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public skillProfileService: SkillProfileService,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {
    this.searchSkillProfile();
  }
  public newSkillProfile(): void {
    this.navCtrl.push(SkillProfileEditPage);
  }
  public skillProfileSelected(event: any, skillProfile: SkillProfile): void {
    this.navCtrl.push(SkillProfileEditPage, { id: skillProfile.id, skillProfile : skillProfile });
  }
  private searchSkillProfile() {
    this.skillProfileService.all().subscribe((response: ResponseWithData<SkillProfile[]>) => {
      if (response.error) {
        console.error(response.error);
      }
      this.skillProfiles = response.data;
    });
  }
  public deleteSkillProfile(skillProfile: SkillProfile) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete the skill profile ' + skillProfile.name +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.skillProfileService.delete(skillProfile.id).subscribe(() => this.searchSkillProfile()); 
          } 
        }
      ]
    });
    alert.present();
  }
}
