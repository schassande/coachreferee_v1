import { ActivatedRoute, ParamMap } from '@angular/router';
import { SkillSetEvaluation, SkillEvaluation, Competency } from './../../app/model/assessment';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AssessmentService } from '../../app/service/AssessmentService';
import { BookmarkService } from '../../app/service/BookmarkService';
import { ResponseWithData } from '../../app/service/response';
import { SkillProfileService } from '../../app/service/SkillProfileService';

import { Assessment, Evaluation } from '../../app/model/assessment';
import { EvaluationRequirement } from '../../app/model/skill';
import { Referee } from '../../app/model/user';
import { SkillProfile } from '../../app/model/skill';

import { flatMap, map } from 'rxjs/operators';

/**
 * Generated class for the AssessRefereePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-assess-referee',
  templateUrl: 'assess-referee.html',
  styleUrls: ['assess-referee.scss']
})
export class AssessRefereePage implements OnInit {

  assessment: Assessment;
  profile: SkillProfile;
  openedGroups: boolean[] = [];
  referee: Referee;
  id2referee: Map<number, Referee> = new Map<number, Referee>();

  constructor(
    private route: ActivatedRoute,
    public assessmentService: AssessmentService,
    public skillProfileService: SkillProfileService,
    public bookmarkService: BookmarkService) {
  }

  ngOnInit() {
    this.bookmarkService.clearContext();
    this.loadAssessment().pipe(
      flatMap(() => this.loadReferee()),
      flatMap(() => this.loadProfile())
    ).subscribe(this.bookmarkPage.bind(this));
  }

  private loadAssessment(): Observable<ResponseWithData<Assessment>> {
    return this.route.paramMap.pipe(
      flatMap( (paramMap: ParamMap) => this.assessmentService.get(parseInt(paramMap.get('id'), 10))),
      map((response: ResponseWithData<Assessment>) => {
        this.assessment = this.addCompetencyField(response.data);
        console.log('Assessment loaded: ' + this.assessment.id);
        return response;
      })
    );
  }

  private addCompetencyField(assessment: Assessment): Assessment {
    if (!assessment.competency) {
        assessment.competency = assessment.competent ? 'YES' : 'NO';
    }
    delete assessment.competent;
    assessment.skillSetEvaluation.forEach( (skillSetEval: SkillSetEvaluation) => {
        if (!skillSetEval.competency) {
            skillSetEval.competency = skillSetEval.competent ? 'YES' : 'NO';
        }
        delete skillSetEval.competent;
        skillSetEval.skillEvaluations.forEach( (skillEval) => {
            if (!skillEval.competency) {
                skillEval.competency = skillEval.competent ? 'YES' : 'NO';
            }
            delete skillEval.competent;
        });
    });
    return assessment;
  }

  isGroupShown(skillSetIdx): boolean {
    return this.openedGroups[skillSetIdx];
  }

  toggleGroup(skillSetIdx) {
    this.openedGroups[skillSetIdx] = !this.openedGroups[skillSetIdx];
    // console.log('toggleGroup', skillSetIdx, this.openedGroups[skillSetIdx]);
  }

  private loadReferee() {
    return this.assessmentService.loadingReferees(this.assessment, this.id2referee)
      .pipe(map(() => {
        this.referee = this.id2referee.get(this.assessment.refereeId);
        console.log('Referee loaded: ' + this.referee.id);
      }));
  }

  private loadProfile() {
    return this.skillProfileService.get(this.assessment.profileId).pipe(
      map((response: ResponseWithData<SkillProfile>) => {
        this.profile = response.data;
        if (this.profile) {
          console.log('Profile loaded: ' + this.referee.id);
          this.openedGroups = this.profile.skillSets.map(
            (skillSet, idx) => this.assessment.skillSetEvaluation[idx].competency === 'NE');
        } else {
          // the profile does not exist
          console.log('ERROR: ProfileId: ', this.assessment.profileId);
        }
      })
    );
  }

  private bookmarkPage() {
    this.bookmarkService.addBookmarkEntry({
      id: 'assess' + this.assessment.id,
      label: 'Assess ' + this.referee.shortName,
      url: `/assessment/edit/${this.assessment.id}` });
    this.bookmarkService.setContext([{
      id: 'referee' + this.referee.id,
      label: 'Referee ' + this.referee.shortName,
      url: `/referee/view/${this.referee.id}` }]);
  }

  public updateSKillCompetency(skillSetIdx: number, skillIdx: number, competency: Competency) {
    console.log('updateSKillCompetency(', skillSetIdx, ',', skillIdx, ',', competency, ')');
    this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations[skillIdx].competency = competency;

    // Step 1 : Compute SkillSet competency
    const missingSkillRequired = this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations.filter(
      (skillEval: SkillEvaluation, skillEvalIdx: number) => skillEval.competency !== 'YES'
        && this.profile.skillSets[skillSetIdx].skills[skillEvalIdx].required).length;
    if (missingSkillRequired) {
      // some skill are required for the skill set to be marked as not competent
      this.assessment.skillSetEvaluation[skillSetIdx].competency = 'NO';
    } else {
      // count the number of yes
      const yesSkillSet = this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations.filter(
        (skillEval) => skillEval.competency === 'YES').length;
      // compute the competency with regards to the requirement (ALL or MAJORITY)
      this.setCompetent(this.assessment.skillSetEvaluation[skillSetIdx],
        this.profile.skillSets[skillSetIdx].requirement,
        yesSkillSet,
        this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations.length);
    }

    // Step 2 : Compute profile competency
    const missingSkillSetRequired = this.assessment.skillSetEvaluation.filter(
      (skillSetEval: SkillSetEvaluation, skillSetEvalIdx: number) => skillSetEval.competency !== 'YES'
        && this.profile.skillSets[skillSetEvalIdx].required).length;
    if (missingSkillSetRequired) {
      this.assessment.competency = 'NO';
    } else {
      const yesProfile = this.assessment.skillSetEvaluation.filter((skillSetEval) => skillSetEval.competency === 'YES').length;
      this.setCompetent(this.assessment,  this.profile.requirement, yesProfile, this.assessment.skillSetEvaluation.length);
    }
    console.log(
        this.profile.name + '=' + this.assessment.competency
        + '/' + this.profile.skillSets[skillSetIdx].name + '=' + this.assessment.skillSetEvaluation[skillSetIdx].competency
        + '/' + this.profile.skillSets[skillSetIdx].skills[skillIdx].name
        + '=' + this.assessment.skillSetEvaluation[skillSetIdx].skillEvaluations[skillIdx].competency);

    this.saveAssessment();
  }

  saveAssessment() {
    this.assessmentService.save(this.assessment).subscribe(() => console.log('Assessment saved'));
  }

  private setCompetent(evaluation: Evaluation, requirement: EvaluationRequirement, nbYes: number, nbTot: number) {
    switch (requirement) {
      case 'ALL_REQUIRED':
        evaluation.competency = nbYes === nbTot ? 'YES' : 'NO';
        break;
        case 'MAJORITY_REQUIRED':
        evaluation.competency = (nbYes * 100 / nbTot) >= 50 ? 'YES' : 'NO';
        break;
    }
  }

  public requirementToString(req: EvaluationRequirement) {
    switch (req) {
      case 'ALL_REQUIRED': return 'All';
      case 'MAJORITY_REQUIRED': return 'Maj';
    }
  }
}
