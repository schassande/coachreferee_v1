import { AssessRefereePage } from './../assess-referee/assess-referee';
import { SkillProfile } from './../../app/model/skill';
import { Observable } from 'rxjs';
import { Component }                from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

import { ResponseWithData }         from './../../app/service/response';
import { EmailService }             from './../../app/service/EmailService';
import { AppSettingsService }       from './../../app/service/AppSettingsService';
import { AssessmentService }        from './../../app/service/AssessmentService';
import { RefereeService }           from './../../app/service/RefereeService';
import { UserService }              from './../../app/service/UserService';
import { ConnectedUserService }     from './../../app/service/ConnectedUserService';
import { SkillProfileService }      from './../../app/service/SkillProfileService';
import { Referee, User }            from './../../app/model/user';
import { Assessment, SkillSetEvaluation } from './../../app/model/assessment';

import { RefereeSelectPage }        from '../referee-select/referee-select';

@Component({
  selector: 'page-assessment-edit',
  templateUrl: 'assessment-edit.html',
})
export class AssessmentEditPage {

  assessment: Assessment = null;
  assessmentCoach: string = '';
  assessmentOwner:boolean = true;
  readonly:boolean = false;
  id2referee: Map<number, Referee> = new Map<number, Referee>();
  refereesLoaded:boolean = false;
  profiles: SkillProfile[];
  assessmentValid: boolean = false;
  profileId: number;
  appCoach:User;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public connectedUserService: ConnectedUserService,
    public userService: UserService,
    public refereeService: RefereeService,
    public assessmentService: AssessmentService,
    public skillProfileService: SkillProfileService,
    public appSettingsService: AppSettingsService,
    public emailService: EmailService) {
  }

  ionViewDidLoad() {
    this.appCoach = this.connectedUserService.getCurrentUser();    
    this.loadAssessment()
      .flatMap((response: ResponseWithData<Assessment>) => {
        this.assessment = response.data; 
        this.computeAssessmentValues();
        //load profiles
        return this.skillProfileService.all().map((response: ResponseWithData<SkillProfile[]>) => {this.profiles = response.data;});
      }).map(() => {
        if (this.assessment) {
          this.profileId = this.assessment.profileId;
          this.assessment.coachId
          // load referees
          this.updateAssessmentValid();
          return this.assessmentService.loadingReferees(this.assessment, this.id2referee).map(() => {
            this.refereesLoaded = true;
          });
        } else {
          this.initAssessment();
          this.updateAssessmentValid();
          return Observable.of('');
        }
      }).subscribe(() => {});
  }

  computeAssessmentValues() {
    if (this.assessment) {
      this.assessmentOwner =  this.assessment.coachId == this.appCoach.id;
      this.assessmentCoach = (this.assessmentOwner ? 'me' : 'another coach');
      this.readonly = !this.assessmentOwner || this.assessment.closed;        
    }
  }

  switchLockCoaching() {
    if (this.assessmentValid) {
      this.assessment.closed = !this.assessment.closed;
      this.computeAssessmentValues();
      this.adjustFromProfile();
      this.assessmentService.save(this.assessment).subscribe();
    }
  }

  public updateAssessmentValid() {
    this.assessmentValid = this.assessment &&  this.profileId && this.assessment.refereeId && true;
  }
  private loadAssessment():Observable<ResponseWithData<Assessment>> {
    const assessment:Assessment = this.navParams.get('assessment');
    const assessmentId = this.navParams.get('assessmentId');
    return (assessment || !assessmentId) 
      ? Observable.of({data : assessment, error: null}) 
      :  this.assessmentService.get(assessmentId);
  }

  initAssessment() {
    let coach: User = this.connectedUserService.getCurrentUser();    
    this.assessment = {
        id: 0,
        version: 0,
        creationDate : new Date(),
        lastUpdate : new Date(),
        dataStatus: 'NEW',
        competition: coach.defaultCompetition,
        field: '1',
        date : new Date(),
        timeSlot: this.computeTimeSlot(new Date()),
        coachId: coach.id,
        gameCategory: 'OPEN',
        gameSpeed: 'Medium',
        gameSkill: 'Medium',
        refereeId : 0,
        refereeShortName: '-',
        comment: '-',
        profileId: 0,
        profileName: '-',
        skillSetEvaluation: [],
        competent: false,
        closed: false
      }
  }

  getReferee(): string {
    const refereeId = this.assessment.refereeId;
    if (refereeId === 0) {
      return '';
    }
    let referee:Referee = this.id2referee.get(refereeId);
    if (referee) {
      return referee.firstName + ' (' + referee.shortName + ')';
    } else {
      return this.assessment.refereeShortName;
    }
  }

  get competition() {
    return this.assessment.competition;
  }

  set competition(c: string) {
    this.assessment.competition = c;
    this.userService.update(this.assessment.coachId, (user:User) => { user.defaultCompetition = c; return user; }).subscribe();
  }

  get date () {
    return this.assessmentService.getAssessmentDateAsString(this.assessment);
  }

  set date(dateStr: string) {
    this.assessmentService.setStringDate(this.assessment, dateStr);
  }
  get closed() {
    return this.assessment.closed
  }
  searchReferee(idx: number) {
    const callbackRefereeSelected = function(referee:Referee) {
      console.log("Selected referee (" + idx + ', ' + referee.id + ')');
      this.assessment.refereeId = referee.id;
      this.assessment.refereeShortName = referee.shortName;
      this.id2referee.set(referee.id, referee);
      this.updateAssessmentValid();
    }.bind(this);
    this.navCtrl.push(RefereeSelectPage, { callback: callbackRefereeSelected });
  }

  computeTimeSlot(ts: Date): string {
    return this.assessmentService.computeTimeSlot(ts);
  }

  assess(event) {
    this.adjustFromProfile();
    this.assessmentService.save(this.assessment)
      .map((response: ResponseWithData<Assessment>) => {
        this.navCtrl.push(AssessRefereePage, { assessmentId: response.data.id, assessment: response.data });
      }).subscribe();
  }

  sendAssessment() {
    this.emailService.sendEmail({
      to: this.connectedUserService.getCurrentUser().email,
      subject: this.assessmentService.assessmentAsEmailSubject(this.assessment),
      body: this.assessmentService.assessmentAsEmailBody(this.assessment),
      isHtml: true
    });
  }

  private adjustFromProfile() {
    if (this.profileId == this.assessment.profileId) {
      return;
    }
    const profile = this.profiles.filter( (profile) => this.profileId == profile.id)[0];
    if (!profile) {
      return;
    }
    this.assessment.profileId = this.profileId;
    this.assessment.profileName = profile.name;
    this.assessment.competent = false;
    this.assessment.comment = '-';
    this.assessment.skillSetEvaluation = [];
    profile.skillSets.forEach((skillSet) => {
      const skillSetEvaluation:SkillSetEvaluation = {
        skillSetName: skillSet.name, 
        skillEvaluations: [],
        competent: false,
        comment: '-'
      };
      skillSetEvaluation.skillEvaluations = [];
      skillSet.skills.forEach((skill) => {
        skillSetEvaluation.skillEvaluations.push({
          skillName: skill.name, 
          competent: false,
          comment: '-'
        });
      });
      this.assessment.skillSetEvaluation.push(skillSetEvaluation);
    });
  }
}