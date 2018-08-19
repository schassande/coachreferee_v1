import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoachingEditPage } from './coaching-edit';

@NgModule({
  declarations: [
    CoachingEditPage,
  ],
  imports: [
    IonicPageModule.forChild(CoachingEditPage),
  ],
})
export class CoachingEditPageModule {}
