import { SkillSet, Skill } from './../../app/model/skill';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { SkillEditPage } from '../skill-edit/skill-edit';

/**
 * Generated class for the SkillSetEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-skill-set-edit',
  templateUrl: 'skill-set-edit.html',
})
export class SkillSetEditPage {
  skillSet: SkillSet;
  skillName:string;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.skillSet = this.navParams.get('skillSet'); 
  }

  saveSkillSet(event) {
    this.navCtrl.pop();
  }

  skillSelected(event, skill: Skill) {
    this.navCtrl.push(SkillEditPage, { skill: skill });
  }
  deleteSkill(skill: Skill) {
    let idx: number = this.skillSet.skills.findIndex((elem) => elem.name === skill.name);
    if (idx >= 0) {
      this.skillSet.skills.splice(idx, 1);
    }
  }
  newSkill(event) {
    if (this.skillName) {
      let skill:Skill = {
        name: this.skillName,
        description: 'Description of ' + this.skillName,
        required: false,
        proLinks: []
      }
      this.skillSet.skills.push(skill);
      this.skillName = '';
      this.navCtrl.push(SkillEditPage, { skill: skill });
    }
  }
}
