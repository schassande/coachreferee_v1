import { NavController } from '@ionic/angular';
import { Competition } from './../../../app/model/competition';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-competition-ranking-best-of2',
  templateUrl: './competition-ranking-best-of2.page.html',
  styleUrls: ['./competition-ranking-best-of2.page.scss'],
})
export class CompetitionRankingBestOf2Page implements OnInit {

  competition: Competition;
  loading = false;
  errors: string[] = [];

  constructor(
    private navController: NavController,
  ) { }

  ngOnInit() {
  }
  back() {
    if (this.competition.id) {
      this.navController.navigateRoot(`/competition/${this.competition.id}/home`);
    } else {
      this.navController.navigateRoot(`/competition/list`);
    }
  }

}
