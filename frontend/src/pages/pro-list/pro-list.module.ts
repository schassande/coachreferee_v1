import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProListPage } from './pro-list';

@NgModule({
  declarations: [
    ProListPage,
  ],
  imports: [
    IonicPageModule.forChild(ProListPage),
  ],
})
export class ProListPageModule {}
