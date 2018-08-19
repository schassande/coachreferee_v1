import { Component, ViewChild } from '@angular/core';
import { Nav, Platform }        from 'ionic-angular';
import { StatusBar }            from '@ionic-native/status-bar';
import { SplashScreen }         from '@ionic-native/splash-screen';
import { ScreenOrientation }    from '@ionic-native/screen-orientation';

import { HomePage }             from '../pages/home/home';
import { UserSelectionPage }    from '../pages/user-selection/user-selection';
import { RefereeListPage }      from '../pages/referee-list/referee-list';
import { ProListPage }          from '../pages/pro-list/pro-list';
import { CoachingListPage }     from '../pages/coaching-list/coaching-list';
import { SkillProfileListPage } from './../pages/skill-profile-list/skill-profile-list';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen,
    private screenOrientation: ScreenOrientation) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'Coach a game', component: CoachingListPage },
      { title: 'Referees', component: RefereeListPage },
      { title: 'PROs', component: ProListPage },
      { title: 'Profile & Skills', component: SkillProfileListPage },
      { title: 'User Change', component: UserSelectionPage }
    ];
    this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT).catch((err) => console.error(err));
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }
}
