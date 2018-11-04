import { AssessmentEditPage } from './../assessment-edit/assessment-edit';
import { ResponseWithData } from './../../app/service/response';
import { AssessmentService } from './../../app/service/AssessmentService';
import { Assessment } from './../../app/model/assessment';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';

/**
 * Generated class for the AssessmentListPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

export interface AssessmentList {
  day: string;
  assessments: Assessment[];
}

@Component({
  selector: 'page-assessment-list',
  templateUrl: 'assessment-list.html',
})
export class AssessmentListPage {

  
  assessments: Assessment[];
  assessmentLists: AssessmentList[];
  error: any;
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public assessmentService: AssessmentService,
    public alertCtrl: AlertController) {
  }

  ionViewDidEnter() {
    this.searchAssessment();
  }

  private searchAssessment() {
    this.assessmentService.all().subscribe((response: ResponseWithData<Assessment[]>) => {
      this.assessments = this.assessmentService.sortAssessments(response.data, true);
      this.assessmentLists = this.computeAssessmentLists(this.assessments);
      this.error = response.error;
    });
  }

  public assessmentSelected(event: any, assessment: Assessment): void {
    this.navCtrl.push(AssessmentEditPage, { id: assessment.id, assessment : assessment });
  }

  getAssessmentDate (assessment: Assessment) {
    return this.assessmentService.getAssessmentDateAsString(assessment);
  }

  public newAssessment(): void {
    this.navCtrl.push(AssessmentEditPage);
  }

  public onSearchBarInput() {
    this.searchAssessment();
  }
  public isPast(assessment:Assessment):boolean {
    return this.assessmentService.compareDate(assessment.date, new Date()) < 0;
  }
  public deleteAssessment(assessment: Assessment) {
    let alert = this.alertCtrl.create({
      title: 'Confirm Deletion',
      message: 'Do you reaaly want to delete the assessment ' + assessment.id +  '?',
      buttons: [
        { text: 'Cancel', role: 'cancel'},
        { 
          text: 'Delete', 
          handler: () => {
            this.assessmentService.delete(assessment.id).subscribe(() => this.searchAssessment()); 
          } 
        }
      ]
    });
    alert.present();
  }

  computeAssessmentLists(assessments: Assessment[]): AssessmentList[] {
    let lists:AssessmentList[] = []
    let currentIndex = -1;
    assessments.forEach((c:Assessment) => {
      let cd:string = this.assessmentService.getAssessmentDateAsString(c);
      if (currentIndex >= 0 && lists[currentIndex].day == cd ) {
        lists[currentIndex].assessments.push(c);
      } else {
        currentIndex ++;
        lists.push({ day: cd, assessments :[c]})
      }
    });
    return lists;
  }

}
