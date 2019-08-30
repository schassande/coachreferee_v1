import { Referee } from './../../../app/model/user';
import { RefereeSelectPage } from './../../referee/referee-select/referee-select';
import { ToolService } from './../../../app/service/ToolService';
import { ResponseWithData } from './../../../app/service/response';
import { flatMap, map, catchError } from 'rxjs/operators';
import { Observable, of, forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { HelpService } from './../../../app/service/HelpService';
import { DateService } from 'src/app/service/DateService';
import { CompetitionService } from './../../../app/service/CompetitionService';
import { Competition } from './../../../app/model/competition';
import { Component, OnInit } from '@angular/core';
import { RefereeService } from 'src/app/service/RefereeService';

@Component({
  selector: 'app-competition-referees',
  templateUrl: './competition-referees.page.html',
  styleUrls: ['./competition-referees.page.scss'],
})
export class CompetitionRefereesPage implements OnInit {

  competition: Competition;
  referees: Referee[] = [];
  loading = false;
  errors: string[] = [];

  constructor(
    private alertCtrl: AlertController,
    private modalController: ModalController,
    private competitionService: CompetitionService,
    public dateService: DateService,
    private helpService: HelpService,
    private navController: NavController,
    private refereeService: RefereeService,
    private route: ActivatedRoute,
    private toolService: ToolService
  ) { }

  ngOnInit() {
    this.helpService.setHelp('competition-edit');
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
          // the competition has not been found => create it
          this.navController.navigateRoot('/competition/list');
        }
        return this.competition;
      }),
      // load referees
      flatMap(() => this.loadReferees()),
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

  private loadReferees(): Observable<Referee[]> {
    console.log('loadReferees');
    if (!this.competition.referees || this.competition.referees.length === 0) {
      this.referees = [];
      return of(this.referees);
    }
    const obs: Observable<Referee>[] = [];
    const newReferees: Referee[] = [];
    this.competition.referees.forEach((ref) => {
      if (ref.refereeId !== null) {
        obs.push(this.refereeService.get(ref.refereeId).pipe(
              map((res: ResponseWithData<Referee>) => {
                  if (res.data) {
                    newReferees.push(res.data);
                  } else {
                      console.error('Referee ' + ref.refereeId + ' does not exist !');
                  }
                  return res.data;
              }))
            );
      } else {
        console.log('null refereeId, ref.refereeShortName', ref.refereeShortName);
      }
    });
    if (obs.length === 0) {
      this.referees = [];
      return of(this.referees);
    }
    return forkJoin(obs).pipe(
      map(() => {
        this.referees = newReferees;
        return this.referees;
      })
    );
  }

  async addReferee() {
    const modal = await this.modalController.create({ component: RefereeSelectPage});
    modal.onDidDismiss().then( (data) => {
      const referee = this.refereeService.lastSelectedReferee.referee;
      if (referee) {
        const idx = this.referees.findIndex((ref) => ref.id === referee.id);
        if (idx >= 0) {
          // the referee is already in the list
          return;
        }
        this.referees.push(referee);
        this.competition.referees.push({ refereeShortName: referee.shortName, refereeId: referee.id});
      }
    });
    return await modal.present();
  }

  deleteReferee(referee: Referee) {
    this.alertCtrl.create({
      message: 'Do you reaaly want to delete the the refere ' + referee.shortName + ' from this competition?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            // remove the referee from the competition object
            this.toolService.deleteFromArrayById(this.competition.referees, referee.id, 'refereeId');
            // remove the referee from the local list
            this.toolService.deleteFromArrayById(this.referees, referee.id);
          }
        }
      ]
    }).then( (alert) => alert.present() );
  }

  back() {
    if (this.competition.id) {
      this.navController.navigateRoot(`/competition/${this.competition.id}/home`);
    } else {
      this.navController.navigateRoot(`/competition/list`);
    }
  }
}
