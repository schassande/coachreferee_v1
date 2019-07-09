import { LoginData } from './../../pages/login-component';
import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { AlertController, ToastController, LoadingController, ModalController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from '@angular/fire/auth';

import { ResponseWithData, Response } from './response';
import { Observable, of, from, Subject } from 'rxjs';
import { ConnectedUserService } from './ConnectedUserService';
import { Injectable } from '@angular/core';
import { User, CONSTANTES, AuthProvider } from './../model/user';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { flatMap, map, catchError } from 'rxjs/operators';
import * as firebase from 'firebase/app';
import { LoginComponent } from 'src/pages/login-component';

import * as Sentry from '@sentry/browser';

@Injectable()
export class UserService  extends RemotePersistentDataService<User> {

    constructor(
        db: AngularFirestore,
        toastController: ToastController,
        private connectedUserService: ConnectedUserService,
        private appSettingsService: AppSettingsService,
        private alertCtrl: AlertController,
        private loadingController: LoadingController,
        private afAuth: AngularFireAuth,
        private modalController: ModalController,
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix(): string {
        return 'user';
    }

    getPriority(): number {
        return 1;
    }

    public save(user: User, cred: firebase.auth.UserCredential = null): Observable<ResponseWithData<User>> {
        if (!user) {
            return of({data: null, error: { error : 'null user', errorCode: -1}});
        }
        const password = user.password;
        delete user.password;
        if (user.dataStatus === 'NEW') {
            let obs: Observable<firebase.auth.UserCredential> = null;
            if (cred !== null  && (user.authProvider === 'FACEBOOK' || user.authProvider === 'GOOGLE')) {
                obs = of(cred);
            } else {
                obs = from(firebase.auth().createUserWithEmailAndPassword(user.email, password));
            }
            return obs.pipe(
                flatMap((userCred: firebase.auth.UserCredential) => {
                    // Store in application user datbase the firestore user id
                    user.accountId = userCred.user.uid;
                    return super.save(user);
                }),
                catchError((err) => {
                    Sentry.captureMessage('UserService.save()' + JSON.stringify(err);
                    console.error(err);
                    return of({ error: err, data: null});
                }),
            );
        } else {
            return super.save(user);
        }
    }

    public delete(id: string): Observable<Response> {
        // check the user to delete is the current user.
        if (this.connectedUserService.getCurrentUser().id !== id) {
            return of({error: {error: 'Not current user', errorCode: 1}});
        }
        // First delete user from database
        return super.delete(id).pipe(
            flatMap( (res) => {
                if (res.error != null) {
                    console.log('Error on delete', res.error);
                    return of (res);
                } else {
                    // then delete the user from firestore user auth database
                    return from(firebase.auth().currentUser.delete()).pipe(
                        map(() => {
                            return {error: null};
                        }),
                        catchError((err) => {
                            console.error(err);
                            return of({error: err});
                        })
                    );
                }
            })
        );
    }

    public login(email: string, password: string): Observable<ResponseWithData<User>> {
        console.log('UserService.login(' + email + ', ' + password + ')');
        let credential = null;
        return from(firebase.auth().signInWithEmailAndPassword(email, password)).pipe(
            flatMap( (cred: firebase.auth.UserCredential) => {
                credential = cred;
                // console.log('login: cred=', JSON.stringify(cred, null, 2));
                return this.getByEmail(email);
            }),
            catchError((err) => {
                console.log('UserService.login(' + email + ', ' + password + ') error=', err);
                Sentry.captureMessage('UserService.login(' + email + ', ' + password + ') error=' + JSON.stringify(err));
                this.loadingController.dismiss(null);
                this.alertCtrl.create({message: err.message}).then((alert) => alert.present());
                return of({ error: err, data: null});
            }),
            map( (ruser: ResponseWithData<User>) => {
                if (ruser.data) {
                    this.connectedUserService.userConnected(ruser.data, credential);
                }
                return ruser;
            })
        );
    }

    /**
     * Try to autologin an user with data stored from local storage.
     */
    public autoLogin(): Observable<ResponseWithData<User>> {
        let loading = null;
        return from(this.loadingController.create({ message: 'Auto login...', translucent: true})).pipe(
            flatMap( (ctrl) => {
                loading = ctrl;
                loading.present();
                return this.appSettingsService.get();
            }),
            flatMap((settings: LocalAppSettings) => {
                const email = settings.lastUserEmail;
                const password = settings.lastUserPassword;
                console.log('UserService.autoLogin(): lastUserEmail=' + email + ', lastUserPassword=' + password);
                if (!email) {
                    loading.dismiss();
                    return of({ error: null, data: null});
                }
                if (!this.connectedUserService.isOnline()) {
                    console.log('UserService.autoLogin(): offline => connect with email only');
                    loading.dismiss();
                    return this.connectByEmail(email, password);
                }
                if (password) {
                    // password is defined => try to login
                    console.log('UserService.autoLogin(): login(' + email + ', ' + password + ')');
                    return this.login(email, password).pipe(
                        flatMap((ruser) =>  {
                            loading.dismiss();
                            return ruser.data ?  of(ruser) : this.askPasswordAndLogin(email);
                        })
                    );
                }
                loading.dismiss();
                return this.askPasswordAndLogin(email);
            })
        );
    }

    /**
     * There is an email but no password. Then ask the password to the user with a confirmation popup.
     * Try to login with the read password.
     * @param email is the email of the user
     */
    public askPasswordAndLogin(email: string): Observable<ResponseWithData<User>> {
        const sub = new Subject<ResponseWithData<User>>(); // use subject due to async actions
        this.modalController.create({ component: LoginComponent, componentProps: { email}}).then( (modal) => {
            modal.onDidDismiss().then( (modalData: any) => {
                const loginData: LoginData = modalData.data as LoginData;
                console.log('askPasswordAndLogin(' + email + ') user response=' + JSON.stringify(loginData));
                if (loginData.action === 'LOGIN') {
                    this.loginWithEmailNPassword(email, loginData.password, loginData.savePassword, sub);
                } else if (loginData.action === 'RESET_PASSWORD') {
                    this.resetPassword(email, sub);
                } else {
                    console.log('Cancel');
                    sub.next({ error: null, data: null});
                    sub.complete();
                }
            });
            modal.present();
        });
        return sub;
    }

    private resetPassword(email, sub: Subject<ResponseWithData<User>>) {
        // console.log('Reset password of the account', email);
        firebase.auth().sendPasswordResetEmail(email).then(() => {
            this.alertCtrl.create({message: 'An email to reset the password of the account ' + email})
                .then((alert) => alert.present());
            sub.next({ error: null, data: null});
            sub.complete();
        });
    }

    private async loginWithEmailNPassword(email: string, password: string, savePassword: boolean, sub: Subject<ResponseWithData<User>>) {
        // console.log('loginWithEmailNPassword(' + email + '): read password=', password, 'save=', savePassword);
        if (password && password.trim().length > 0) {
            // try to login with the password
            console.log('UserService.askPasswordToLogin(' + email + '): login with read password');
            from(this.loadingController.create({ message: 'Login...', translucent: true}).then((l) => l.present())).pipe(
                flatMap(() => this.login(email, password)),
                flatMap ( (ruser) => {
                    if (ruser.error) {
                        // login failed
                        savePassword = false; // don't save the password if error occurs
                        Sentry.captureMessage('UserService.loginWithEmailNPassword(' + email + ') error=' + JSON.stringify(ruser.error));
                        if (ruser.error.code === 'auth/network-request-failed') {
                            console.log('UserService.askPasswordToLogin(' + email + '): no network');
                            // no network => check the email/password with local storage
                            return this.connectByEmail(email, password);
                        }
                    }
                    return of(ruser);
                }),
                map( (ruser) => {
                    if (ruser.data) { // Login with success
                        console.log('UserService.askPasswordToLogin(' + email + '): login with success');
                        if (savePassword) {
                            console.log('UserService.askPasswordToLogin(' + email + '): store password.');
                            // The user is ok to store password in settings on local device
                            this.appSettingsService.setLastUser(email, password);
                        }
                    }
                    this.loadingController.dismiss();
                    sub.next(ruser);
                    sub.complete();
                })
            ).subscribe();
        } else {
            console.log('UserService.askPasswordToLogin(' + email + '): no password provided');
            this.alertCtrl.create({message: 'Password is missing.'}).then((alert) => alert.present());
            sub.next({ error: null, data: null});
            sub.complete();
        }
    }

    private connectByEmail(email: string, password: string = null): Observable<ResponseWithData<User>> {
        return this.appSettingsService.get().pipe(
            flatMap((appSettings) => {
                if (email === appSettings.lastUserEmail && (password == null || password === appSettings.lastUserPassword)) {
                    console.log('UserService.connectByEmail(' + email + ',' + password + '): password is valid => get user');
                    return this.getByEmail(email);
                } else {
                    console.log('UserService.connectByEmail(' + email + ',' + password + '): wrong password.');
                    return of({ error: null, data: null });
                }
            }),
            map( (ruser: ResponseWithData<User>) => {
                if (ruser.data) {
                    console.log('UserService.connectByEmail(' + email + ',' + password + '): user found', ruser.data);
                    this.connectedUserService.userConnected(ruser.data, null);
                } else {
                    console.log('UserService.connectByEmail(' + email + ',' + password + '): fail.');
                }
                return ruser;
            })
        );
}
    public getUrlPathOfGet(id: number) {
        return '?id=' + id;
    }

    public getByEmail(email: string): Observable<ResponseWithData<User>> {
        return this.queryOne(this.getCollectionRef().where('email', '==', email), 'default').pipe(
            map((ruser => {
                // console.log('UserService.getByEmail(' + email + ')=', ruser.data);
                return ruser;
            })),
            catchError((err) => {
                return of({ error: err, data: null});
            }),
        );
    }

    public authWithGoogle(): Observable<ResponseWithData<User>> {
        return this.authWith(new firebase.auth.GoogleAuthProvider(), 'GOOGLE');
    }

    public authWithFacebook(): Observable<ResponseWithData<User>> {
        return this.authWith(new firebase.auth.FacebookAuthProvider(), 'FACEBOOK');
    }

    public authWith(authProvider: any, authName: AuthProvider): Observable<ResponseWithData<User>> {
        let credential = null;
        return from(firebase.auth().signInWithPopup(authProvider)).pipe(
            flatMap( (cred: firebase.auth.UserCredential) => {
                credential = cred;
                console.log('authWith: cred=', JSON.stringify(cred, null, 2));
                return this.getByEmail(cred.user.email);
            }),
            catchError((err) => {
                // console.log('authWith error: ', err);
                return of({ error: err, data: null});
            }),
            flatMap( (ruser: ResponseWithData<User>) => {
                if (!ruser.data) {
                    return this.save(this.createUserFromCredential(credential, authName), credential);
                } else {
                    return of(ruser);
                }
            }),
            map( (ruser: ResponseWithData<User>) => {
                console.log('authWith user: ', JSON.stringify(ruser));
                if (ruser.data) {
                    this.connectedUserService.userConnected(ruser.data, credential);
                }
                return ruser;
            })
        );
    }
    public computeShortName(firstName, lastName): string {
        return firstName.charAt(0).toUpperCase()
            + lastName.charAt(0).toUpperCase()
            + lastName.charAt(lastName.length - 1).toUpperCase();
    }

    private createUserFromCredential(cred: firebase.auth.UserCredential, authProvider: AuthProvider): User {
        if (!cred || !cred.user) {
            return null;
        }
        const names = cred.user.displayName.split(' ');
        const firstName: string = names[0];
        const lastName: string = names.length > 1 ? names[1] : ' ';
        const shortName: string = this.computeShortName(firstName, lastName);
        return {
            id: null,
            accountId: cred.user.uid,
            role: 'USER',
            authProvider,
            version: 0,
            creationDate : new Date(),
            lastUpdate : new Date(),
            dataStatus: 'NEW',
            firstName,
            lastName,
            shortName,
            country: CONSTANTES.countries[0][0],
            email: cred.user.email,
            gender: 'M',
            mobilePhones: [ ],
            photo: {
              path: null,
              url: null
            },
            speakingLanguages: [ 'EN' ],
            referee : {
                refereeLevel: null,
                refereeCategory : 'OPEN',
                nextRefereeLevel: null
            },
            refereeCoach: {
                refereeCoachLevel: null
            },
            password: '',
            token: null,
            defaultCompetition: '',
            defaultGameCatory: 'OPEN',
            dataSharingAgreement: {
              personnalInfoSharing: 'YES',
              photoSharing: 'YES',
              refereeAssessmentSharing: 'YES',
              refereeCoachingInfoSharing: 'YES',
              coachAssessmentSharing: 'YES',
              coachCoachingInfoSharing: 'YES',
              coachProSharing: 'NO'
            },
            groupIds: []
        };
    }
}
