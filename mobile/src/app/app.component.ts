import { AppSettingsService } from './service/AppSettingsService';
import { Component } from '@angular/core';
import { Platform, MenuController, NavController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { VersionService } from './service/VersionService';
import { Bookmark, BookmarkService } from './service/BookmarkService';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private navController: NavController,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private versionService: VersionService,
    public bookmarkService: BookmarkService,
    public appSettingsService: AppSettingsService,
    private menu: MenuController,
    private firestore: AngularFirestore
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Migrate local database if required.
      this.versionService.migrate().subscribe();
      this.appSettingsService.get().subscribe((appSetttings) => {
        if (appSetttings.forceOffline) {
          console.log('firestore.disableNetwork');
          this.firestore.firestore.disableNetwork();
        } else {
          console.log('firestore.enableNetwork()');
          this.firestore.firestore.enableNetwork();
        }
      });
    });
  }
  route(url: string = '/home') {
    console.log('route(', url, ')');
    this.navController.navigateRoot(url);
    this.menu.close();
  }
  openBookmark(entry: Bookmark) {
    if (entry) {
      this.navController.navigateRoot(entry.url);
    }
  }
}
