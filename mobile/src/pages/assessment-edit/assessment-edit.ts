import { ModalController, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SkillProfile } from './../../app/model/skill';
import { Observable, of } from 'rxjs';
import { Component, OnInit } from '@angular/core';

import { ResponseWithData } from './../../app/service/response';
import { AppSettingsService } from './../../app/service/AppSettingsService';
import { AssessmentService } from './../../app/service/AssessmentService';
import { RefereeService } from './../../app/service/RefereeService';
import { UserService } from './../../app/service/UserService';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { SkillProfileService } from './../../app/service/SkillProfileService';
import { Referee, User } from './../../app/model/user';
import { Assessment, SkillSetEvaluation } from './../../app/model/assessment';

import { RefereeSelectPage } from '../referee-select/referee-select';
import { flatMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'page-assessment-edit',
  templateUrl: 'assessment-edit.html',
  styleUrls: ['assessment-edit.scss']
})
export class AssessmentEditPage implements OnInit {

  assessment: Assessment = null;
  assessmentCoach = '';
  assessmentOwner = true;
  readonly = false;
  id2referee: Map<string, Referee> = new Map<string, Referee>();
  refereesLoaded = false;
  profiles: SkillProfile[];
  assessmentValid = false;
  profileId: string;
  appCoach: User;
  sending = false;

  constructor(
    public modalController: ModalController,
    private route: ActivatedRoute,
    private navController: NavController,
    public connectedUserService: ConnectedUserService,
    public userService: UserService,
    public refereeService: RefereeService,
    public assessmentService: AssessmentService,
    public skillProfileService: SkillProfileService,
    public appSettingsService: AppSettingsService,
    public toastController: ToastController) {
  }

  ngOnInit() {
    this.appCoach = this.connectedUserService.getCurrentUser();
    this.loadAssessment().pipe(
      flatMap((response: ResponseWithData<Assessment>) => {
        this.assessment = response.data;
        this.computeAssessmentValues();
        // load profiles
        return this.skillProfileService.all().pipe(map((res: ResponseWithData<SkillProfile[]>) => {this.profiles = res.data; }));
      }),
      map(() => {
        if (this.assessment) {
          this.assessmentService.currentAssessment = this.assessment;
          this.profileId = this.assessment.profileId;
          // load referees
          this.updateAssessmentValid();
          return this.assessmentService.loadingReferees(this.assessment, this.id2referee).pipe(map(() => {
            this.refereesLoaded = true;
          }));
        } else {
          this.initAssessment();
          this.assessmentService.currentAssessment = this.assessment;
          this.updateAssessmentValid();
          return of('');
        }
      })).subscribe(() => {});
  }

  computeAssessmentValues() {
    if (this.assessment) {
      this.assessmentOwner =  this.assessment.coachId === this.appCoach.id;
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

  updateAssessedLevel() {
    this.updateAssessmentValid();
  }

  private loadAssessment(): Observable<ResponseWithData<Assessment>> {
    return this.route.paramMap.pipe(
      flatMap( (paramMap: ParamMap) => {
        const assessmentId = paramMap.get('id');
        return this.assessmentService.get(assessmentId);
      })
    );
  }

  initAssessment() {
    const coach: User = this.connectedUserService.getCurrentUser();
    this.assessment = {
        id: null,
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
        refereeId : null,
        refereeShortName: '-',
        comment: '-',
        profileId: null,
        profileName: '-',
        skillSetEvaluation: [],
        competency: 'NE',
        closed: false,
        sharedWith: []
      };
  }

  getReferee(): string {
    const refereeId = this.assessment.refereeId;
    if (refereeId === null) {
      return '';
    }
    const referee: Referee = this.id2referee.get(refereeId);
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
    this.userService.update(this.assessment.coachId, (user: User) => { user.defaultCompetition = c; return user; }).subscribe();
  }

  get date() {
    return this.assessmentService.getAssessmentDateAsString(this.assessment);
  }

  set date(dateStr: string) {
    this.assessmentService.setStringDate(this.assessment, dateStr);
  }
  get closed() {
    return this.assessment.closed;
  }
  async searchReferee(idx: number) {
    const modal = await this.modalController.create({ component: RefereeSelectPage});
    modal.onDidDismiss().then( (data) => {
        const referee: Referee = this.refereeService.lastSelectedReferee.referee;
        this.refereeService.lastSelectedReferee.referee = null; // clean
        if (referee) {
          // a referee has been selected
          this.assessment.refereeId = referee.id;
          this.assessment.refereeShortName = referee.shortName;
          this.id2referee.set(referee.id, referee);
          this.updateAssessmentValid();
          if (!this.profileId && referee.referee.nextRefereeLevel) {
            // try to find the right profile from the referee
            const foundProfiles = this.profiles.filter((profile) => profile.level === referee.referee.nextRefereeLevel);
            if (foundProfiles.length > 0) {
              // a profile has been found => use it
              this.profileId = foundProfiles[0].id;
              this.adjustFromProfile();
            }
          }

          // if (this.assessment.)
        }
      });
    return await modal.present();
  }

  computeTimeSlot(ts: Date): string {
    return this.assessmentService.computeTimeSlot(ts);
  }

  assess(event) {
    this.adjustFromProfile();
    this.assessmentService.save(this.assessment).pipe(
      map((response: ResponseWithData<Assessment>) => {
        this.navController.navigateRoot(`/assessment/assess/${response.data.id}`);
      })).subscribe();
  }

  saveNback() {
    if (this.assessment.closed || !this.assessmentValid) {
      this.navController.navigateRoot(`/assessment/list`);
    } else {
      this.assessmentService.save(this.assessment).subscribe(() => {
        console.log('saved');
        this.navController.navigateRoot(`/assessment/list`);
      });
    }
  }

  sendAssessment() {
    this.sending = true;
    this.assessmentService.sendAssessmentByEmail(this.assessment.id, this.assessment.profileId, this.assessment.refereeId)
      .pipe(
        map((res) => {
          this.sending = false;
          this.toastController.create({
            message : 'An email has been sent with the assessment sheet.',
            position: 'bottom', color: 'light',
            duration: 3000 }).then((toast) => toast.present());
          console.log('sendAssessment =>' + JSON.stringify(res));
        }),
        catchError( (err: any) => {
          this.sending = false;
          console.error(err);
          return of(err);
        })
      )
      .subscribe();
  }

  private getProfile(profileId): SkillProfile {
    return this.profiles.filter( (profile) => profileId === profile.id)[0];
  }
  private adjustFromProfile() {
    if (this.profileId === this.assessment.profileId) {
      return;
    }
    const profile = this.getProfile(this.profileId);
    if (!profile) {
      return;
    }
    this.assessment.profileId = this.profileId;
    this.assessment.profileName = profile.name;
    this.assessment.competency = 'NE';
    this.assessment.comment = '-';
    this.assessment.skillSetEvaluation = [];
    profile.skillSets.forEach((skillSet) => {
      const skillSetEvaluation: SkillSetEvaluation = {
        skillSetName: skillSet.name,
        skillEvaluations: [],
        competency: 'NE',
        comment: '-'
      };
      skillSetEvaluation.skillEvaluations = [];
      skillSet.skills.forEach((skill) => {
        skillSetEvaluation.skillEvaluations.push({
          skillName: skill.name,
          competency: 'NE',
          comment: '-'
        });
      });
      this.assessment.skillSetEvaluation.push(skillSetEvaluation);
    });
  }
}
