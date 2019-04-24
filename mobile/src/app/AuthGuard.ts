import { ConnectedUserService } from './service/ConnectedUserService';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(
      private connectedUserService: ConnectedUserService,
      private navController: NavController
    ) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const activate: boolean = this.connectedUserService.getCurrentUser() != null;
    if (!activate) {
        this.navController.navigateRoot('/home');
    }
    return activate;
  }
}
