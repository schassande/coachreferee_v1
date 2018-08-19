import { ResponseWithData } from './../../app/service/response';
import { PROService } from './../../app/service/PROService';
import { ProEditPage } from './../pro-edit/pro-edit';
import { PROLink, PersistentPRO } from './../../app/model/coaching';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { Skill } from '../../app/model/skill';

/**
 * Generated class for the SkillEditPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-skill-edit',
  templateUrl: 'skill-edit.html',
})
export class SkillEditPage {
  skill: Skill;
  skillName:string;

  searchPros: PersistentPRO[]
  searchInput: string;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public proService: PROService) {
  }

  ionViewDidLoad() {
    this.skill = this.navParams.get('skill'); 
  }

  saveSet(event) {
    this.navCtrl.pop();
  }

  proLinkSelected(event, pro: PROLink) {
    this.navCtrl.push(ProEditPage, { proId: pro.id });
  }

  deletePro(pro: PROLink) {
    if (!this.skill.proLinks) {
      this.skill.proLinks = [];
    }
    let idx: number = this.skill.proLinks.findIndex((elem) => elem.id === pro.id);
    if (idx >= 0) {
      this.skill.proLinks.splice(idx, 1);
    }
  }

  onSearchBarInput(event) {
    this.proService.searchPros(this.searchInput).subscribe((response: ResponseWithData<PersistentPRO[]>) => {
      this.searchPros = response.data;
    });
  }

  addPRO($event, pro: PersistentPRO) {
    if (!this.skill.proLinks) {
      this.skill.proLinks = [];
    }
    this.skill.proLinks.push({ id: pro.id, problemShortDesc: pro.problemShortDesc });
  }

  proSelected(event, pro: PersistentPRO) {
    this.navCtrl.push(ProEditPage, { proId: pro.id });
  }
}
