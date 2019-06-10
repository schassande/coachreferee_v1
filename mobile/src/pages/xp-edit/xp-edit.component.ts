import { DateService } from './../../app/service/DateService';
import { NavController } from '@ionic/angular';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { XpService } from './../../app/service/XpService';
import { Xp, CoachingDay } from './../../app/model/xphistory';
import { Component, OnInit } from '@angular/core';
import { flatMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Coaching } from 'src/app/model/coaching';

const DATE_SEP = '-';

@Component({
  selector: 'app-xp-edit',
  templateUrl: './xp-edit.component.html',
  styleUrls: ['./xp-edit.component.scss'],
})
export class XpEditComponent implements OnInit {

  xp: Xp;
  xpId: string;
  error: any;

  constructor(
    private navController: NavController,
    private route: ActivatedRoute,
    private connectedUserService: ConnectedUserService,
    private dateService: DateService,
    private xpService: XpService
  ) { }

  ngOnInit() {
    return this.route.paramMap.pipe(
      flatMap( (paramMap: ParamMap) => {
        this.xpId = paramMap.get('id');
        console.log('xpId=' + this.xpId);
        if (this.xpId) {
          return this.xpService.get(this.xpId);
        } else {
          return of( { data: this.newXp(), error: null});
        }
      })
    ).subscribe((rxp) => {
      this.xp = rxp.data;
      this.error = rxp.error;
    });
  }

  delete(dayIdx: number) {
    this.xp.days.splice(dayIdx, 1);
  }

  newXp(): Xp {
    return  {
      id: null,
      version: 0,
      creationDate: new Date(),
      lastUpdate: new Date(),
      dataStatus: 'NEW',
      coachId: this.connectedUserService.getCurrentUser().id,
      eventName: this.connectedUserService.getCurrentUser().defaultCompetition,
      eventClass: 'B',
      year: new Date().getFullYear(),
      days: [this.buildNewDay()]
    };
  }

  public onCDDate(cd: CoachingDay, event) {
    cd.coachingDate = new Date(event.detail.value);
  }
  public getCDDate(cd: CoachingDay): string {
    return this.dateService.date2string(cd.coachingDate);
  }

  public setCDDate(cd: CoachingDay, dateStr: string) {
    cd.coachingDate = this.dateService.string2date(dateStr, cd.coachingDate);
  }

  saveNback() {
    this.xp.year = this.xp && this.xp.days && this.xp.days.length > 0
      ? this.xp.days[0].coachingDate.getFullYear()
      : new Date().getFullYear();
    this.xpService.save(this.xp).subscribe(() => {
      this.navController.navigateRoot(`/xp/list`);
    });
  }

  deleteXp() {
    if (this.xpId) {
      this.xpService.delete(this.xpId).subscribe( () => {
        this.navController.navigateRoot(`/xp/list`);
      });
    }
  }

  newDay() {
    this.xp.days.push(this.buildNewDay());
  }

  buildNewDay(): CoachingDay {
    return {
      coachingDate: new Date(),
      gameDuration: 40,
      nbGames: 8,
      coachingDuration: 320,
      refereeAllocation: 'No'
    };
  }

  onGameDataChange(cd: CoachingDay) {
    cd.coachingDuration = cd.nbGames * cd.gameDuration;
  }

  autoCompute() {
    // TODO
  }
}
