import { ResponseWithData } from './../../app/service/response';
import { CoachingEditPage } from './../coaching-edit/coaching-edit';
import { Coaching } from './../../app/model/coaching';
import { AlertController } from 'ionic-angular';
import { CoachingService } from './../../app/service/CoachingService';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';


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

@IonicPage()
@Component({
  selector: 'page-coaching-list',
  templateUrl: 'coaching-list.html',
})
export class CoachingListPage {

  coachings: Coaching[];
  coachingLists: CoachingList[];
  error: any;
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public coachingService: CoachingService,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {
    this.searchCoaching();
  }

  private searchCoaching() {
    this.coachingService.all().subscribe((response: ResponseWithData<Coaching[]>) => {
      this.coachings = this.coachingService.sortCoachings(response.data, true);
      this.coachingLists = this.computeCoachingLists(this.coachings);
      this.error = response.error;
    });
  }

  public coachingSelected(event: any, coaching: Coaching): void {
    this.navCtrl.push(CoachingEditPage, { id: coaching.id, coaching : coaching });
  }

  getCoachingDate (coaching: Coaching) {
    return this.coachingService.getCoachingDateAsString(coaching);
  }

  public newCoaching(): void {
    this.navCtrl.push(CoachingEditPage);
  }

  public onSearchBarInput() {
    this.searchCoaching();
  }
  public isPast(coaching:Coaching):boolean {
    return this.coachingService.compareDate(coaching.date, new Date()) < 0;
  }
  public deleteCoaching(coaching: Coaching) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete the coaching ' + coaching.id +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.coachingService.delete(coaching.id).subscribe(() => this.searchCoaching()); 
          } 
        }
      ]
    });
    alert.present();
  }

  computeCoachingLists(coachings: Coaching[]): CoachingList[] {
    let lists:CoachingList[] = []
    let currentIndex = -1;
    coachings.forEach((c:Coaching) => {
      let cd:string = this.coachingService.getCoachingDateAsString(c);
      if (currentIndex >= 0 && lists[currentIndex].day == cd ) {
        lists[currentIndex].coachings.push(c);
      } else {
        currentIndex ++;
        lists.push({ day: cd, coachings :[c]})
      }
    });
    return lists;
  }
}