import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

export type LoginAction = 'LOGIN' | 'RESET_PASSWORD' | 'CANCEL';

export interface LoginData {
    savePassword?: boolean;
    password?: string;
    action?: LoginAction;
}

@Component({
    selector: 'login-comp',
    template: `
<ion-content padding>
    <div style="text-align: center; margin-top: 10px;"><img src="assets/imgs/logo.png" height="50" /></div>
    <div style="margin: 10px 0;">Please enter the password of the account '{{email}}'.</div>
    <ion-list>
        <ion-item>
            <ion-label fixed>Password</ion-label>
            <ion-input type="password" [(ngModel)]="loginData.password" max="15" tabindex="1" autofocus="true"></ion-input>
        </ion-item>
        <ion-item>
            <ion-label fixed>Remenber on this device</ion-label>
            <ion-checkbox scope="end" [checked]="loginData.savePassword" (click)="switchSavePassword()"></ion-checkbox>
        </ion-item>
    </ion-list>
    <ion-button shape="round" (click)="resetPassword()">
        <ion-icon name="send" scope="start"></ion-icon>
        &nbsp;Reset password
    </ion-button>
    <ion-button shape="round" (click)="login()">Login</ion-button>
</ion-content>`
  })
export class LoginComponent  {
    public email: string;
    public loginData: LoginData = { password: '', savePassword: true, action: 'LOGIN' };

    constructor(private modalController: ModalController) {}

    switchSavePassword() {
        this.loginData.savePassword = !this.loginData.savePassword;
    }
    login() {
        this.loginData.action = 'LOGIN';
        this.modalController.dismiss(this.loginData);
    }
    resetPassword() {
        this.loginData.action = 'RESET_PASSWORD';
        this.modalController.dismiss(this.loginData);
    }
    cancel() {
        this.loginData.action = 'CANCEL';
        this.modalController.dismiss(this.loginData);
    }
}
