import { Coaching, PersistentPRO } from './../../app/model/coaching';
import { Assessment } from './../../app/model/assessment';
import { SkillProfile } from './../../app/model/skill';
import { User, Referee } from './../../app/model/user';
import { ExportedData } from './../../app/model/settings';
import { File, FileEntry }    from '@ionic-native/file';
import { SocialSharing }      from '@ionic-native/social-sharing';
import { FilePath }           from '@ionic-native/file-path';
import { Toast }              from '@ionic-native/toast';
import { FileChooser }        from '@ionic-native/file-chooser';
import { Observable }         from 'rxjs/Rx';
import { Component }          from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { UserService }          from '../../app/service/UserService';
import { SkillProfileService }  from '../../app/service/SkillProfileService';
import { PROService }           from '../../app/service/PROService';
import { CoachingService }      from '../../app/service/CoachingService';
import { RefereeService }       from '../../app/service/RefereeService';
import { AppSettingsService }   from '../../app/service/AppSettingsService';
import { LocalAppSettings }     from '../../app/model/settings';
import { AssessmentService }    from '../../app/service/AssessmentService';
import { ConnectedUserService } from '../../app/service/ConnectedUserService';
import { EmailService }         from '../../app/service/EmailService';

/**
 * Generated class for the SettingsPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings: LocalAppSettings;
  msg:string[] = [];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public appSettingsService: AppSettingsService,
    public connectedUserService: ConnectedUserService,
    public userService: UserService,
    public refereeService: RefereeService,
    public proService: PROService,
    public skillProfileService: SkillProfileService,
    public coachingService: CoachingService,
    public assessmentService: AssessmentService,
    public alertController: AlertController,
    public emailService: EmailService,
    public file: File,
    private filePath: FilePath,
    private socialSharing: SocialSharing,
    private toast: Toast,
    private fileChooser: FileChooser
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
    this.appSettingsService.get().subscribe((settings: LocalAppSettings) => {
      this.settings = settings;
    });
  }

  public saveSettings(event) {
    this.appSettingsService.save(this.settings).subscribe((settings: LocalAppSettings) => {
      this.settings = settings;
      this.navCtrl.pop();
    });
  }

  
  public importData() {
    this.fileChooser.open().then(uri => {
      console.log(uri);
      this.filePath.resolveNativePath(uri)
        .then( filePath => {
          console.log('Filepath=', filePath);
          const index = filePath.lastIndexOf('/');
          const path:string = filePath.substr(0, index);
          const fileName:string = filePath.substr(index + 1);
          this.file.readAsText(path, fileName).then((content) => {
            this.importDataObjects(JSON.parse(content));
          }).catch(e => { console.log(e); this.toast.showLongBottom('Fail to read file: ' + e).subscribe()});
        }).catch(e => { console.log(e); this.toast.showLongBottom('Fail to manage file url: ' + e).subscribe()});;
    }).catch(e => { console.log(e); this.toast.showLongBottom('Fail to select a file: ' + e).subscribe()});
  }

  private importDataObjects(importObj:ExportedData) {
    let obs: Observable<any>[] = [];
    if (importObj.users) {
      importObj.users.forEach((elem:User) => {
        //re create Date object avec serialisation
        elem.birthday = new Date(elem.birthday);
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.userService.save(elem));
      });
    }         
    if (importObj.referees) {
      importObj.referees.forEach((elem:Referee) => {
        elem.birthday = new Date(elem.birthday);
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.refereeService.save(elem));
      });
    }      
    if (importObj.skillProfiles) {
      importObj.skillProfiles.forEach((elem:SkillProfile) => {
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.skillProfileService.save(elem));
      });
    } 
    if (importObj.pros) {
      importObj.pros.forEach((elem:PersistentPRO) => {
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.proService.save(elem));
      });
    }
    if (importObj.coachings) {
      importObj.coachings.forEach((elem:Coaching) => {
        elem.date = new Date(elem.date);
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.coachingService.save(elem));
      });
    }
    if (importObj.assessments) {
      importObj.assessments.forEach((elem:Assessment) => {
        elem.date = new Date(elem.date);
        elem.creationDate = new Date(elem.creationDate);
        elem.lastUpdate = new Date(elem.lastUpdate);
        obs.push(this.assessmentService   .save(elem))
      });
    }
    Observable.forkJoin(obs).subscribe(() => {
      this.msg.push(obs.length + ' data imported.')
      this.toast.showShortCenter(obs.length + ' data imported.').subscribe();
      console.log(obs.length + ' data imported.');
    })
  }

  public exportData() {
      let alert = this.alertController.create();
      alert.setTitle('Which data do you want to export?');
  
      alert.addInput({type: 'checkbox', label: 'Users',           value: 'users',           checked: true});
      alert.addInput({type: 'checkbox', label: 'Referees',        value: 'referees',        checked: true});
      alert.addInput({type: 'checkbox', label: 'Skill Profiles',  value: 'skillProfiles',   checked: true});
      alert.addInput({type: 'checkbox', label: 'PROs'     ,       value: 'pros',            checked: true});
      alert.addInput({type: 'checkbox', label: 'Coachings',       value: 'coachings',       checked: true});
      alert.addInput({type: 'checkbox', label: 'Assessments',     value: 'assessments',     checked: true});
      alert.addButton('Cancel');
      alert.addButton({
        text: 'Export',
        handler: (data: string[]) => {
            let exportObj:ExportedData = {};
            let observables = [];
            if (data.indexOf('users')>=0)         observables.push(this.userService.all().map(          (response) => exportObj.users         =  response.data));
            if (data.indexOf('referees')>=0)      observables.push(this.refereeService.all().map(       (response) => exportObj.referees      =  response.data));
            if (data.indexOf('skillProfiles')>=0) observables.push(this.skillProfileService.all().map(  (response) => exportObj.skillProfiles =  response.data));
            if (data.indexOf('pros')>=0)          observables.push(this.proService.all().map(           (response) => exportObj.pros          =  response.data));
            if (data.indexOf('coachings')>=0)     observables.push(this.coachingService.all().map(      (response) => exportObj.coachings     =  response.data));
            if (data.indexOf('assessments')>=0)   observables.push(this.assessmentService.all().map(    (response) => exportObj.assessments   =  response.data));
            Observable.forkJoin(observables).subscribe( () => {
              let str = JSON.stringify(exportObj, null, 2);
              // console.log('Exported data: ', str);
              const fileName = `referee_coach_${new Date().getTime()}.json`;
              const path = this.file.dataDirectory;
              const fullFileName = path + fileName;
              //console.log('Writing file: ' + fullFileName);
              this.file.writeFile(path, fileName, str, {replace: true})
                .then((fe:FileEntry) => {
                  // console.log('Write OK', fe);
                  this.socialSharing.share(null, null, fe.nativeURL, null).then(()=> this.msg.push('Data exported'));
                }).catch((error) => {console.error('Writing error: ', error); this.toast.showLongBottom('Fail to write file: ' + error).subscribe(); });
            });
          }
      });
      alert.present();
  }

  public resetData() {
    let alert = this.alertController.create();
    alert.setTitle('Which data do you want to reset?');

    alert.addInput({type: 'checkbox', label: 'Users',           value: 'users',           checked: true});
    alert.addInput({type: 'checkbox', label: 'Referees',        value: 'referees',        checked: true});
    alert.addInput({type: 'checkbox', label: 'Skill Profiles',  value: 'skillProfiles',   checked: true});
    alert.addInput({type: 'checkbox', label: 'PROs'     ,       value: 'pros',            checked: true});
    alert.addInput({type: 'checkbox', label: 'Coachings',       value: 'coachings',       checked: true});
    alert.addInput({type: 'checkbox', label: 'Assessments',     value: 'assessments',     checked: true});
    alert.addButton('Cancel');
    alert.addButton({
      text: 'Export',
      handler: (data: string[]) => {
          let observables = [];
          if (data.indexOf('users')>=0)         observables.push(this.userService.clear());
          if (data.indexOf('referees')>=0)      observables.push(this.refereeService.clear());
          if (data.indexOf('skillProfiles')>=0) observables.push(this.skillProfileService.clear());
          if (data.indexOf('pros')>=0)          observables.push(this.proService.clear());
          if (data.indexOf('coachings')>=0)     observables.push(this.coachingService.clear());
          if (data.indexOf('assessments')>=0)   observables.push(this.assessmentService.clear());
          Observable.forkJoin(observables).subscribe( () => {
            this.msg.push('Data cleared');
          });
        }
    });
    alert.present();
  }

}
