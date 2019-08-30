import { ActivatedRoute } from '@angular/router';
import { HelpService } from './../../../app/service/HelpService';
import { DateService } from 'src/app/service/DateService';
import { CompetitionService } from './../../../app/service/CompetitionService';
import { NavController } from '@ionic/angular';
import { Competition } from './../../../app/model/competition';
import { Component, OnInit } from '@angular/core';
import { map, catchError, flatMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Component({
  selector: 'app-competition-ranking',
  templateUrl: './competition-ranking.page.html',
  styleUrls: ['./competition-ranking.page.scss'],
})
export class CompetitionRankingPage implements OnInit {

  competition: Competition;
  loading = false;
  errors: string[] = [];

  constructor(
    private competitionService: CompetitionService,
    public dateService: DateService,
    private helpService: HelpService,
    private navController: NavController,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.helpService.setHelp('competition-list');
    this.loadCompetition().subscribe();
  }

  private loadCompetition(): Observable<Competition> {
    this.loading = true;
    // load id from url path
    return this.route.paramMap.pipe(
      // load competition from the id
      flatMap( (paramMap) => this.competitionService.get(paramMap.get('id'))),
      map( (rcompetition) => {
        this.competition = rcompetition.data;
        if (!this.competition) {
          // the competition has not been found => back to list of competition
          this.navController.navigateRoot('/competition/list');
        }
        return this.competition;
      }),
      catchError((err) => {
        console.log('loadCompetition error: ', err);
        this.loading = false;
        return of(this.competition);
      }),
      map (() => {
        this.loading = false;
        return this.competition;
      })
    );
  }

  back() {
    if (this.competition.id) {
      this.navController.navigateRoot(`/competition/${this.competition.id}/home`);
    } else {
      this.navController.navigateRoot(`/competition/list`);
    }
  }

}
