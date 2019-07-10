import { UserSelectorComponent } from './../../user-selector-component';
import { SharedWith, DATA_REGIONS } from './../../../app/model/common';
import { AlertController, ModalController, NavController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

import { CompetitionService } from './../../../app/service/CompetitionService';
import { DateService } from './../../../app/service/DateService';
import { RefereeService } from './../../../app/service/RefereeService';
import { UserService } from './../../../app/service/UserService';

import { Competition } from './../../../app/model/competition';
import { Referee, User } from './../../../app/model/user';
import { ResponseWithData } from 'src/app/service/response';
import { flatMap, map } from 'rxjs/operators';

import { RefereeSelectPage } from './../../referee-select/referee-select';

@Component({
  selector: 'app-competition-edit',
  templateUrl: './competition-edit.component.html',
  styleUrls: ['./competition-edit.component.scss'],
})
export class CompetitionEditComponent implements OnInit {

  competition: Competition;
  referees: Referee[] = [];
  coaches: User[] = [];
  loading = false;
  regions = DATA_REGIONS;

  constructor(
    private alertCtrl: AlertController,
    private competitionService: CompetitionService,
    private dateService: DateService,
    private modalController: ModalController,
    private navController: NavController,
    private refereeService: RefereeService,
    private route: ActivatedRoute,
    private userService: UserService
    ) {
  }

  ngOnInit() {
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
          this.createCompetition();
        }
        return this.competition;
      }),
      // load referees
      flatMap(() => this.loadReferees()),
      // load coaches
      flatMap(() => this.loadCoaches()),
      map (() => {
        this.loading = false;
        return this.competition;
      })
    );
  }

  private createCompetition() {
    this.competition = {
      id: null,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      name: '',
      date: new Date(),
      year: new Date().getFullYear(),
      region : 'Others',
      country : '',
      referees: [],
      refereeCoaches: []
    };
  }

  private loadReferees(): Observable<Referee[]> {
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
      }
    });
    return forkJoin(obs).pipe(
      map(() => {
        this.referees = newReferees;
        return this.referees;
      })
    );
  }

  private loadCoaches(): Observable<User[]> {
    const obs: Observable<Referee>[] = [];
    const newCoaches: User[] = [];
    this.competition.refereeCoaches.forEach((coach) => {
      if (coach.coachId !== null) {
        obs.push(this.userService.get(coach.coachId).pipe(
              map((res: ResponseWithData<User>) => {
                  if (res.data) {
                    newCoaches.push(res.data);
                  } else {
                      console.error('Coach ' + coach.coachId + ' does not exist !');
                  }
                  return res.data;
              }))
           );
      }
    });
    return forkJoin(obs).pipe(
      map(() => {
        this.coaches = newCoaches;
        return this.coaches;
      })
    );
  }

  get name() {
    return this.competition.name;
  }

  set name(nameStr: string) {
    // TODO check the competition name : not already exist, include a date
    this.competition.name = nameStr;
  }

  get date() {
    return this.dateService.date2string(this.competition.date);
  }

  set date(dateStr: string) {
    this.competition.date = this.dateService.string2date(dateStr, this.competition.date);
    this.competition.year = this.competition.date.getFullYear();
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
            this.deleteFromArrayById(this.competition.referees, referee.id, 'refereeId');
            // remove the referee from the local list
            this.deleteFromArrayById(this.referees, referee.id);
          }
        }
      ]
    }).then( (alert) => alert.present() );
  }

  async addRefereeCoach() {
    const modal = await this.modalController.create({ component: UserSelectorComponent});
    modal.onDidDismiss().then( (data) => {
      const selection: SharedWith = data.data as SharedWith;
      if (selection) {
        selection.users.forEach((user) => {
          this.addToSetById(this.competition.refereeCoaches, { coachShortName: user.shortName, coachId: user.id}, 'coachId');
          this.addToSetById(this.coaches, user);
        });
      }
    });
    return await modal.present();
  }

  deleteRefereeCoach(coach: User) {
    this.alertCtrl.create({
      message: 'Do you reaaly want to delete the the refere coach ' + coach.shortName + ' from this competition?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            // remove the referee coach from the competition object
            this.deleteFromArrayById(this.competition.refereeCoaches, coach.id, 'coachId');
            // remove the referee coach  from the local list
            this.deleteFromArrayById(this.coaches, coach.id);
          }
        }
      ]
    }).then( (alert) => alert.present() );
  }

  saveNback() {
    this.competitionService.save(this.competition).pipe(
      map((rcompetition) => {
        if (rcompetition.data) {
          this.navController.navigateRoot(`/competition/list`);
        } else {
          this.alertCtrl.create({ message: 'Error when saving the competition: ' + rcompetition.error.error })
            .then( (alert) => alert.present() );
        }
      })
    ).subscribe();
  }

  onSwipe(event) {
    // console.log('onSwipe', event);
    if (event.direction === 4) {
      this.saveNback();
    }
  }

  addToSetById(arrays: any[], itemToAdd: any, idFieldName: string = 'id') {
    const idx = arrays.findIndex( (item) => itemToAdd[idFieldName] === item[idFieldName]);
    if (idx < 0) {
      arrays.push(itemToAdd);
    }
  }

  deleteFromArrayById(arrays: any[], id: string, idFieldName: string = 'id') {
    const idx = arrays.findIndex( (item) => id === item[idFieldName]);
    if (idx >= 0) {
      arrays.splice(idx, 1);
    }
  }
}
