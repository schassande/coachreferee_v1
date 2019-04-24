import { CoachingService } from './../../app/service/CoachingService';
import { Component, OnInit } from '@angular/core';

/**
 * Generated class for the CompetitionListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
export interface Competition {
  name: string;
  begin: Date;
}

@Component({
  selector: 'page-competition-list',
  templateUrl: 'competition-list.html',
})
export class CompetitionListPage implements OnInit {

  competitions: Competition[];
  error;
  searchInput: string;

  constructor(
    public coachingService: CoachingService) {
  }

  ngOnInit() {
    console.log('ionViewDidLoad CompetitionListPage');
  }
  onSearchBarInput() {
    // TODO
  }
}
