import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoachingGamePage } from './coaching-game';

@NgModule({
  declarations: [
    CoachingGamePage,
  ],
  imports: [
    IonicPageModule.forChild(CoachingGamePage),
  ],
})
export class CoachingGamePageModule {}
