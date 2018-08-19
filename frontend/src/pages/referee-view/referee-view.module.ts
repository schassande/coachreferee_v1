import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RefereeViewPage } from './referee-view';

@NgModule({
  declarations: [
    RefereeViewPage,
  ],
  imports: [
    IonicPageModule.forChild(RefereeViewPage),
  ],
})
export class RefereeViewPageModule {}
