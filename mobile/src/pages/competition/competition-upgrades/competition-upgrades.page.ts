import { CoachingService } from './../../../app/service/CoachingService';
import { Coaching } from 'src/app/model/coaching';
import { ToolService } from 'src/app/service/ToolService';
import { Observable, of, forkJoin } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { flatMap, map, catchError } from 'rxjs/operators';

import { CompetitionService } from './../../../app/service/CompetitionService';
import { Competition } from './../../../app/model/competition';
import { DateService } from './../../../app/service/DateService';
import { HelpService } from './../../../app/service/HelpService';
import { Referee, RefereeLevel } from './../../../app/model/user';
import { ResponseWithData } from 'src/app/service/response';
import { RefereeService } from './../../../app/service/RefereeService';

class UpgradableReferee {
  referee: Referee;
  coachings: Coaching[];
  constructor(referee: Referee, coachings: Coaching[]) {
    this.referee = referee;
    this.coachings = coachings;
  }
}
@Component({
  selector: 'app-competition-upgrades',
  templateUrl: './competition-upgrades.page.html',
  styleUrls: ['./competition-upgrades.page.scss'],
})
export class CompetitionUpgradesPage implements OnInit {

  competition: Competition;
  loading = false;
  errors: string[] = [];
  upgradeLevels: RefereeLevel[] = [];
  referees: Referee[] = [];
  currentUgradeLevel: RefereeLevel = null;
  refereesToUpgrade: UpgradableReferee[] = [];

  constructor(
    private coachingService: CoachingService,
    private competitionService: CompetitionService,
    public dateService: DateService,
    private helpService: HelpService,
    private navController: NavController,
    private refereeService: RefereeService,
    private route: ActivatedRoute,
    private toolService: ToolService,
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
      flatMap( () => this.loadReferees()),
      map( () => this.computeUpgradeLevels()),
      flatMap( () => this.computeUpgradableReferees()),
      map (() => {
        this.loading = false;
        return this.competition;
      })
    );
  }

  loadReferees(): Observable<any> {
    const obs: Observable<ResponseWithData<Referee>>[] = [];
    this.upgradeLevels = [];
    this.competition.referees.forEach( (ref) => {
      obs.push(this.refereeService.get(ref.refereeId).pipe(
        map( (rref) => {
          if (rref.data) {
            this.referees.push(rref.data);
          }
          return rref;
        })
      ));
    });
    return forkJoin(obs).pipe(
      map (() => this.referees)
    );
  }

  computeUpgradeLevels(): RefereeLevel[] {
    this.upgradeLevels = [];
    this.referees.forEach((ref) => {
      if (ref.referee.nextRefereeLevel && this.upgradeLevels.indexOf(ref.referee.nextRefereeLevel) < 0) {
        console.log('add upgrade level: ' + ref.referee.nextRefereeLevel);
        this.upgradeLevels.push(ref.referee.nextRefereeLevel);
      }
    });
    this.upgradeLevels = this.upgradeLevels.sort().reverse();
    if (this.upgradeLevels.length) {
      this.currentUgradeLevel = this.upgradeLevels[0];
      this.onUpgradeLevelChanged();
    }
    return this.upgradeLevels;
  }
  onUpgradeLevelChanged() {
    this.computeUpgradableReferees().subscribe();
  }
  computeUpgradableReferees(): Observable<any> {
    const refsToUpgrade: UpgradableReferee[] = [];
    const obs: Observable<any>[] = [];
    this.referees.forEach((ref) => {
      if (ref.referee.nextRefereeLevel && ref.referee.nextRefereeLevel === this.currentUgradeLevel) {
        // console.log('Select the referee: ' + ref.shortName);
        // load the coaching of the referee during the competition
        obs.push(this.coachingService.getCoachingByRefereeCompetition(ref.id, this.competition.id).pipe(
          map((rcoachings) => {
          refsToUpgrade.push(new UpgradableReferee(ref, rcoachings.data));
        })));
      }
    });
    return forkJoin(obs).pipe(
      map (() => {
        // sort by referee first name + last name
        refsToUpgrade.sort( (ur1, ur2) => {
          const n1 = ur1.referee.firstName + ' ' + ur1.referee.lastName;
          const n2 = ur2.referee.firstName + ' ' + ur2.referee.lastName;
          return n1.localeCompare(n2);
        });
        refsToUpgrade.forEach(ref => {
          this.coachingService.sortCoachings(ref.coachings, true);
        });
        this.refereesToUpgrade = refsToUpgrade;
        return this.refereesToUpgrade;
      })
    );
  }

  getRefIdx(coaching: Coaching, refereeId: string): number {
    return coaching.refereeIds.indexOf(refereeId);
  }

  back() {
    if (this.competition.id) {
      this.navController.navigateRoot(`/competition/${this.competition.id}/home`);
    } else {
      this.navController.navigateRoot(`/competition/list`);
    }
  }
}
