import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SkillProfileListPage } from './skill-profile-list';

@NgModule({
  declarations: [
    SkillProfileListPage,
  ],
  imports: [
    IonicPageModule.forChild(SkillProfileListPage),
  ],
})
export class SkillProfileListPageModule {}
