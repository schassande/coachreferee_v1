import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SkillEditPage } from './skill-edit';

@NgModule({
  declarations: [
    SkillEditPage,
  ],
  imports: [
    IonicPageModule.forChild(SkillEditPage),
  ],
})
export class SkillEditPageModule {}
