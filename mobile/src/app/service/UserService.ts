import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { AlertController, ToastController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { ResponseWithData, Response } from './response';
import { Observable, of, from, Subject } from 'rxjs';
import { ConnectedUserService } from './ConnectedUserService';
import { Injectable } from '@angular/core';
import { User } from './../model/user';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { flatMap, map, catchError } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable()
export class UserService  extends RemotePersistentDataService<User> {

    constructor(
        private connectedUserService: ConnectedUserService,
        private appSettingsService: AppSettingsService,
        db: AngularFirestore,
        private alertCtrl: AlertController,
        toastController: ToastController
    ) {
        super(db, toastController);
    }

    getLocalStoragePrefix(): string {
        return 'user';
    }

    getPriority(): number {
        return 1;
    }

    public save(user: User): Observable<ResponseWithData<User>> {
        const password = user.password;
        delete user.password;
        if (user.dataStatus === 'NEW') {
            return from(firebase.auth().createUserWithEmailAndPassword(user.email, password)).pipe(
                flatMap((userCred: firebase.auth.UserCredential) => {
                    // Store in application user datbase the firestore user id
                    user.accountId = userCred.user.uid;
                    return super.save(user);
                }),
                catchError((err) => {
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
        return this.appSettingsService.get().pipe(
            flatMap((settings: LocalAppSettings) => {
                const email = settings.lastUserEmail;
                const password = settings.lastUserPassword;
                console.log('UserService.autoLogin(): lastUserEmail=' + email + ', lastUserPassword=' + password);
                if (!email) {
                    return of({ error: null, data: null});
                }
                if (!this.connectedUserService.isOnline()) {
                    console.log('UserService.autoLogin(): offline => connect with email only');
                    return this.connectByEmail(email, password);
                }
                if (password) {
                    // password is defined => try to login
                    console.log('UserService.autoLogin(): login(' + email + ', ' + password + ')');
                    return this.login(email, password).pipe(
                        flatMap((ruser) =>  ruser.data ?  of(ruser) : this.askPasswordAndLogin(email))
                    );
                }
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
        from(this.alertCtrl.create({
            message: 'Please enter the password of the account \'' + email +  '\'.',
            inputs: [
                { name: 'password', type: 'password'},
                { name: 'savePassword', type: 'checkbox', label: 'Store password on device', value: 'true', checked: true }],
            buttons: [
                { text: 'Cancel', role: 'cancel',
                    handler: () => {
                        console.log('Cancel password demand');
                        sub.next({ error: null, data: null});
                        sub.complete();
                    }
                },
                { text: 'Login',
                    handler: (data: any) => {
                        console.log('askPasswordAndLogin(' + email + '): read password=', data.password, 'save=', data.savePassword);
                        if (data.password && data.password.trim().length > 0) {
                            // try to login with the password
                            console.log('UserService.askPasswordToLogin(' + email + '): login with read password');
                            this.login(email, data.password).pipe(
                                flatMap ( (ruser) => {
                                    if (ruser.error) {
                                        // login failed
                                        data.savePassword = false; // don't save the password if error occurs
                                        if (ruser.error.code === 'auth/network-request-failed') {
                                            console.log('UserService.askPasswordToLogin(' + email + '): no network');
                                            // no network => check the email/password with local storage
                                            return this.connectByEmail(email, data.password);
                                        }
                                    }
                                    return of(ruser);
                                }),
                                map( (ruser) => {
                                    if (ruser.data) { // Login with success
                                        console.log('UserService.askPasswordToLogin(' + email + '): login with success');
                                        if (data.savePassword) {
                                            console.log('UserService.askPasswordToLogin(' + email + '): store password.');
                                            // The user is ok to store password in settings on local device
                                            this.appSettingsService.setLastUser(email, data.password);
                                        }
                                    }
                                    sub.next(ruser);
                                    sub.complete();
                                }),
                            ).subscribe();
                        } else {
                            console.log('UserService.askPasswordToLogin(' + email + '): no password provided');
                            sub.next({ error: null, data: null});
                            sub.complete();
                        }
                    }
                }
            ]
        }).then( (alert) => alert.present()));
        return sub;
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
}
