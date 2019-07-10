import { Competition } from './../../../app/model/competition';
import { NavController } from '@ionic/angular';
import { CompetitionService } from './../../../app/service/CompetitionService';
import { Component, OnInit } from '@angular/core';

/**
 * Generated class for the CompetitionListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-competition-list',
  templateUrl: 'competition-list.html',
})
export class CompetitionListPage implements OnInit {

  competitions: Competition[];
  error;
  searchInput: string;

  constructor(
    private navController: NavController,
    public competitionService: CompetitionService) {
  }

  ngOnInit() {
    console.log('ionViewDidLoad CompetitionListPage');
  }
  onSearchBarInput() {
    // TODO
  }

  competitionSelected(competition: Competition) {

  }
  deleteCompetition(competition) {
  }

  onSwipe(event) {
    // console.log('onSwipe', event);
    if (event.direction === 4) {
      this.navController.navigateRoot(`/home`);
    }
  }
}
