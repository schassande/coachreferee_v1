import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SkillProfileEditPage } from './skill-profile-edit';

@NgModule({
  declarations: [
    SkillProfileEditPage,
  ],
  imports: [
    IonicPageModule.forChild(SkillProfileEditPage),
  ],
})
export class SkillProfileEditPageModule {}
