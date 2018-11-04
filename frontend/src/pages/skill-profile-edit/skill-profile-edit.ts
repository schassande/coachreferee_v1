import { SkillSetEditPage } from './../skill-set-edit/skill-set-edit';
import { Observable } from 'rxjs';
import { ResponseWithData } from './../../app/service/response';
import { SkillProfile, SkillSet } from './../../app/model/skill';
import { SkillProfileService } from './../../app/service/SkillProfileService';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

/**
 * Generated class for the SkillProfileEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-skill-profile-edit',
  templateUrl: 'skill-profile-edit.html',
})
export class SkillProfileEditPage {
  skillProfile: SkillProfile;
  skillSetName:string;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public skillProfileService: SkillProfileService,
    public connectedUserService: ConnectedUserService,
    public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.loadSkillProfile().subscribe((response: ResponseWithData<SkillProfile>) => {
      this.skillProfile = response.data; 
      if (this.skillProfile) {
      } else {
        this.initSkillProfile();
      }
    });
    
  }
  private loadSkillProfile():Observable<ResponseWithData<SkillProfile>> {
    const skillProfile:SkillProfile = this.navParams.get('skillProfile');
    const skillProfileId = this.navParams.get('skillProfileId');
    return (skillProfile || !skillProfileId) 
      ? Observable.of({data : skillProfile, error: null}) 
      :  this.skillProfileService.get(skillProfileId);
  }

  private initSkillProfile() {
    this.skillProfile = {
      id: 0,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      name: '',
      description: '',
      skillSets: [],
      requirement: 'ALL_REQUIRED'
    }
  }

  saveSkillProfile(event) {
    this.skillProfileService.save(this.skillProfile)
      .map((response: ResponseWithData<SkillProfile>) => {
        this.navCtrl.pop();
        return response;
      }).subscribe(
        (data)=>console.log("Profil " + this.skillProfile.name + " saved: " + JSON.stringify(data)), 
        (err)=>console.log("Error when saving Profil " + this.skillProfile.name + ": " + JSON.stringify(err))
        );
  }

  deleteSkillProfile(event) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete this skill profile ' + this.skillProfile.name +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.navCtrl.pop();
          } 
        }
      ]
    });
    alert.present();
  }

  skillSetSelected(event, skillSet: SkillSet) {
    this.navCtrl.push(SkillSetEditPage, { skillSet: skillSet });
  }
  deleteSkillSet(skillSet: SkillSet) {
    let idx: number = this.skillProfile.skillSets.findIndex((elem) => elem.name === skillSet.name);
    console.log('deleteSkillSet: ', idx);
    if (idx >= 0) {
      this.skillProfile.skillSets.splice(idx, 1);
    }
  }
  newSkillSet(event) {
    if (this.skillSetName) {
      let skillSet:SkillSet = {
        name: this.skillSetName,
        description: 'Description of ' + this.skillSetName,
        requirement: 'ALL_REQUIRED',
        required: false,
        skills: []
      }
      this.skillProfile.skillSets.push(skillSet);
      this.skillSetName = '';
      this.navCtrl.push(SkillSetEditPage, { skillSet: skillSet });
    }
  }
}
