import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RefereeSelectPage } from './referee-select';

@NgModule({
  declarations: [
    RefereeSelectPage,
  ],
  imports: [
    IonicPageModule.forChild(RefereeSelectPage),
  ],
})
export class RefereeSelectPageModule {}
