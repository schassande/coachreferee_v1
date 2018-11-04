import { Component }                from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Observable }               from 'rxjs';

import { AssessmentService }        from '../../app/service/AssessmentService';
import { BookmarkService }          from '../../app/service/BookmarkService';
import { ResponseWithData }         from '../../app/service/response';
import { SkillProfileService }      from '../../app/service/SkillProfileService';

import { Assessment, Evaluation }   from '../../app/model/assessment';
import { EvaluationRequirement }    from '../../app/model/skill';
import { Referee }                  from '../../app/model/user';
import { SkillProfile }             from '../../app/model/skill';

import { RefereeViewPage }          from '../referee-view/referee-view';

/**
 * Generated class for the AssessRefereePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-assess-referee',
  templateUrl: 'assess-referee.html',
})
export class AssessRefereePage {

  assessment: Assessment;
  profile: SkillProfile;
  referee: Referee;
  id2referee: Map<number, Referee> = new Map<number, Referee>();
  refereesLoaded = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public assessmentService: AssessmentService,
    public skillProfileService: SkillProfileService,
    public bookmarkService: BookmarkService) {
  }

  ionViewDidLoad() {
    this.bookmarkService.clearContext();
    this.loadAssessment()
      .flatMap(() => this.loadReferee())
      .flatMap(() => this.loadProfile())
      .subscribe(this.bookmarkPage.bind(this));
  }

  private loadAssessment():Observable<ResponseWithData<Assessment>> {
    this.assessment = this.navParams.get('assessment');
    const assessmentId = this.navParams.get('assessmentId');
    return (this.assessment) 
      ? Observable.of({data : this.assessment, error: null}) 
      : this.assessmentService.get(assessmentId).map((response: ResponseWithData<Assessment>) => { this.assessment = response.data; return response; });
  }
  private loadReferee() {
    return this.assessmentService.loadingReferees(this.assessment, this.id2referee)
      .map(() => this.referee = this.id2referee.get(this.assessment.refereeId));
  }
  private loadProfile() {
    return this.skillProfileService.get(this.assessment.profileId)
      .map((response: ResponseWithData<SkillProfile>) => {
        this.profile = response.data;
      });
  }
  private bookmarkPage() {
    this.bookmarkService.addBookmarkEntry({ 
      id: 'assess' + this.assessment.id, 
      label: 'Assess ' + this.referee.shortName, 
      component: AssessRefereePage, 
      parameter : { assessmentId: this.assessment.id } });
    this.bookmarkService.setContext([{ 
      id: 'referee' + this.referee.id, 
      label: 'Referee ' + this.referee.shortName, 
      component: RefereeViewPage, 
      parameter : { id: this.referee.id } }]);    
  }
  public updateSKillCompetency(skillSetIdx, skillIdx) {
      let yesSkillSet = this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations.filter((skillEval) => skillEval.competent).length;
      this.setCompetent(this.assessment.skillSetEvaluation[skillSetIdx], 
        this.profile.skillSets[skillSetIdx].requirement, 
        yesSkillSet, 
        this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations.length);
      let yesProfile = this.assessment.skillSetEvaluation.filter((skillEval) => skillEval.competent).length;
      this.setCompetent(this.assessment,  this.profile.requirement, yesProfile, this.assessment.skillSetEvaluation.length);
      console.log(
        this.profile.name + "=" + yesProfile + this.assessment.competent
        + "/" + this.profile.skillSets[skillSetIdx].name + "=" + yesSkillSet + this.assessment.skillSetEvaluation[skillSetIdx].competent
        + "/" + this.profile.skillSets[skillSetIdx].skills[skillIdx].name  
        + "=" + this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations[skillIdx].competent);
    }

  private setCompetent(evaluation:Evaluation, requirement:EvaluationRequirement, nbYes:number, nbTot:number) {
    switch(requirement) {
      case "ALL_REQUIRED": 
        evaluation.competent = nbYes == nbTot;
        break;
        case "MAJORITY_REQUIRED":
        evaluation.competent = (nbYes * 100 / nbTot) >= 50;
        break;
    }
}

  public requirementToString(req:EvaluationRequirement) {
    switch(req){
      case "ALL_REQUIRED": return 'All';
      case "MAJORITY_REQUIRED": return 'Maj'
    }
  }
}