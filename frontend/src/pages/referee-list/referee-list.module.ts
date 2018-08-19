import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RefereeListPage } from './referee-list';

@NgModule({
  declarations: [
    RefereeListPage,
  ],
  imports: [
    IonicPageModule.forChild(RefereeListPage),
  ],
})
export class RefereeListPageModule {}
