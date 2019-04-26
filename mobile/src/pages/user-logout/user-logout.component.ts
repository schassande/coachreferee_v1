import { NavController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-logout',
  template: 'loging out ...'
})
export class UserLogoutComponent implements OnInit {

  constructor(private navController: NavController) { }

  ngOnInit() {
    this.navController.navigateRoot('/home');
  }
}
