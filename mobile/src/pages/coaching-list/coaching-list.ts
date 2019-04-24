import { ResponseWithData } from './../../app/service/response';
import { Coaching } from './../../app/model/coaching';
import { CoachingService } from './../../app/service/CoachingService';
import { Component, OnInit } from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';


export interface CoachingList {
  day: string;
  coachings: Coaching[];
}

/**
 * Generated class for the CoachingListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-coaching-list',
  templateUrl: 'coaching-list.html',
  styleUrls: ['coaching-list.scss']
})
export class CoachingListPage implements OnInit {

  coachings: Coaching[];
  coachingLists: CoachingList[];
  error: any;
  searchInput: string;

  constructor(
    private navController: NavController,
    public coachingService: CoachingService,
    public alertCtrl: AlertController) {
  }

  ngOnInit() {
    this.searchCoaching();
  }

  private searchCoaching() {
    this.coachingService.searchCoachings(this.searchInput).subscribe((response: ResponseWithData<Coaching[]>) => {
      this.coachings = this.coachingService.sortCoachings(response.data, true);
      this.coachingLists = this.computeCoachingLists(this.coachings);
      this.error = response.error;
    });
  }

  public coachingSelected(event: any, coaching: Coaching): void {
    this.navController.navigateRoot(`/coaching/edit/${coaching.id}`);
  }

  getCoachingDate (coaching: Coaching) {
    return this.coachingService.getCoachingDateAsString(coaching);
  }

  getRefereeShortNames(coaching: Coaching) {
    return coaching.referees.map((ref) => ref.refereeShortName).join(', ');
  }
  public newCoaching(): void {
    this.navController.navigateRoot(`/coaching/create`);
  }

  public onSearchBarInput() {
    this.searchCoaching();
  }
  public isPast(coaching: Coaching): boolean {
    return this.coachingService.compareDate(coaching.date, new Date()) < 0;
  }
  public deleteCoaching(coaching: Coaching) {
    this.alertCtrl.create({
      message: 'Do you reaaly want to delete the coaching <br><b>' + this.getCoachingDate(coaching) + ':' + coaching.timeSlot
        + ', Field ' + coaching.field + ' with ' + this.getRefereeShortNames(coaching) + '</b> ?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        {
          text: 'Delete',
          handler: () => {
            this.coachingService.delete(coaching.id).subscribe(() => this.searchCoaching());
          }
        }
      ]
    }).then( (alert) => alert.present() );
  }

  computeCoachingLists(coachings: Coaching[]): CoachingList[] {
    const lists: CoachingList[] = [];
    let currentIndex = -1;
    coachings.forEach((c: Coaching) => {
      const cd: string = this.coachingService.getCoachingDateAsString(c);
      if (currentIndex >= 0 && lists[currentIndex].day === cd ) {
        lists[currentIndex].coachings.push(c);
      } else {
        currentIndex ++;
        lists.push({ day: cd, coachings : [c]});
      }
    });
    return lists;
  }
}