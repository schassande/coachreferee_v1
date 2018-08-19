import { BrowserModule }          from '@angular/platform-browser';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicStorageModule }     from '@ionic/storage';
import { Network }                from '@ionic-native/network';
import { Camera }                 from '@ionic-native/camera';
import { File }                   from '@ionic-native/file';
import { EmailComposer }          from '@ionic-native/email-composer';
import { StatusBar }              from '@ionic-native/status-bar';
import { SplashScreen }           from '@ionic-native/splash-screen';
import { FileChooser }            from '@ionic-native/file-chooser';
import { SocialSharing }          from '@ionic-native/social-sharing';
import { ScreenOrientation }      from '@ionic-native/screen-orientation';
import { Toast }                  from '@ionic-native/toast';
import { FilePath }               from '@ionic-native/file-path';
import { HttpModule }             from '../../node_modules/@angular/http';

import { MyApp }                    from './app.component';

import { AssessmentService }        from './service/AssessmentService';
import { CoachingService }          from './service/CoachingService';
import { PROService }               from './service/PROService';
import { RefereeService }           from './service/RefereeService';
import { SkillProfileService }      from './service/SkillProfileService';
import { ConnectedUserService }     from './service/ConnectedUserService';
import { LocalDatabaseService }     from './service/LocalDatabaseService';
import { SynchroService }           from './service/SynchroService';
import { AppSettingsService }       from './service/AppSettingsService';
import { UserService }              from './service/UserService';
import { EmailService }             from './service/EmailService';

import { HomePage }                 from '../pages/home/home';
import { SettingsPage }             from '../pages/settings/settings';
import { UserSelectionPage }        from '../pages/user-selection/user-selection';
import { UserEditPage }             from '../pages/user-edit/user-edit';
import { CoachingEditPageModule }   from '../pages/coaching-edit/coaching-edit.module';
import { CoachingGamePageModule }   from '../pages/coaching-game/coaching-game.module';
import { CoachingListPageModule }   from '../pages/coaching-list/coaching-list.module';
import { ProListPageModule }        from '../pages/pro-list/pro-list.module';
import { ProEditPageModule }        from '../pages/pro-edit/pro-edit.module';
import { RefereeSelectPageModule }  from '../pages/referee-select/referee-select.module';
import { RefereeViewPageModule }    from '../pages/referee-view/referee-view.module';
import { RefereeEditPageModule }    from '../pages/referee-edit/referee-edit.module';
import { RefereeListPageModule }    from '../pages/referee-list/referee-list.module';
import { SkillSetEditPageModule }     from '../pages/skill-set-edit/skill-set-edit.module';
import { SkillProfileListPageModule } from '../pages/skill-profile-list/skill-profile-list.module';
import { SkillProfileEditPageModule } from '../pages/skill-profile-edit/skill-profile-edit.module';
import { SkillEditPageModule }      from './../pages/skill-edit/skill-edit.module';
import { CoachingImprovmentFeedbackEditPageModule }   from './../pages/coaching-improvment-feedback-edit/coaching-improvment-feedback-edit.module';
import { CoachingPositiveFeedbackEditPageModule }     from './../pages/coaching-positive-feedback-edit/coaching-positive-feedback-edit.module';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    UserEditPage,
    UserSelectionPage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    CoachingEditPageModule, CoachingGamePageModule, CoachingListPageModule, CoachingPositiveFeedbackEditPageModule, CoachingImprovmentFeedbackEditPageModule,
    ProListPageModule, ProEditPageModule,
    RefereeListPageModule, RefereeEditPageModule, RefereeViewPageModule, RefereeSelectPageModule,
    SkillProfileEditPageModule, SkillProfileListPageModule, SkillSetEditPageModule, SkillEditPageModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot({ name: '__myDb', driverOrder : [ 'indexeddb', 'websql', 'sqlite']}),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    UserEditPage,
    UserSelectionPage,
    SettingsPage
  ],
  providers: [
    Network,
    Camera,
    EmailComposer,
    File,
    ScreenOrientation,
    SocialSharing,
    FileChooser,
    Toast,
    FilePath,
    LocalDatabaseService,
    ConnectedUserService,
    AppSettingsService,
    StatusBar,
    SplashScreen,
    SynchroService,
    UserService,
    EmailService,
    SkillProfileService,
    RefereeService,
    PROService,
    CoachingService,
    AssessmentService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
