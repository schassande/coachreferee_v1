import { Component } from '@angular/core';
import { Platform, MenuController, NavController } from '@ionic/angular';

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
    private menu: MenuController
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Migrate local database if required.
      this.versionService.migrate().subscribe();
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
