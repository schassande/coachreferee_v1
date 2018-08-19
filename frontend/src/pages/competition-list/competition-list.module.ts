import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CompetitionListPage } from './competition-list';

@NgModule({
  declarations: [
    CompetitionListPage,
  ],
  imports: [
    IonicPageModule.forChild(CompetitionListPage),
  ],
})
export class CompetitionListPageModule {}
