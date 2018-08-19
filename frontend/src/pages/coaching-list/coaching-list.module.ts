import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CoachingListPage } from './coaching-list';

@NgModule({
  declarations: [
    CoachingListPage,
  ],
  imports: [
    IonicPageModule.forChild(CoachingListPage),
  ],
})
export class CoachingListPageModule {}
