import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SkillSetEditPage } from './skill-set-edit';

@NgModule({
  declarations: [
    SkillSetEditPage,
  ],
  imports: [
    IonicPageModule.forChild(SkillSetEditPage),
  ],
})
export class SkillSetEditPageModule {}
