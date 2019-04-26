import { AppSettingsService } from './AppSettingsService';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { ResponseWithData } from './response';
import { Observable, of, from, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ConnectedUserService } from './ConnectedUserService';
import { Injectable } from '@angular/core';
import { User } from './../model/user';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { flatMap, map, catchError } from 'rxjs/operators';
import * as firebase from 'firebase/app';

@Injectable()
export class UserService  extends RemotePersistentDataService<User> {

    public currentUser: User = null;

    constructor(
        private connectedUserService: ConnectedUserService,
        private appSettingsService: AppSettingsService,
        db: AngularFirestore,
        private http: HttpClient,
        private alertCtrl: AlertController
    ) {
        super(db);
    }

    getLocalStoragePrefix(): string {
        return 'user';
    }

    getPriority(): number {
        return 1;
    }

    public save(user: User): Observable<ResponseWithData<User>> {
        const email = user.email;
        const password = user.password;
        user.password = null;
        return from(firebase.auth().createUserWithEmailAndPassword(email, password)).pipe(
            flatMap(() => super.save(user)),
            catchError((err) => {
                return of({ error: err, data: null});
            }),
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

    public autoLogin(email: string, password: string = null): Observable<ResponseWithData<User>> {
        if (!email) {
            console.log('UserService.autoLogin(' + email + ', ' + password + '): no email');
            // No email => no autologin possible
            return of({ error: null, data: null });
        }
        if (!this.connectedUserService.isOnline()) {
            console.log('UserService.autoLogin(' + email + ', ' + password + '): offline');
            return this.getByEmail(email).pipe(
                map( (ruser: ResponseWithData<User>) => {
                    if (ruser.data) {
                        this.connectedUserService.userConnected(ruser.data, null);
                    }
                    return ruser;
                })
            );
        }
        if (password) {
            // password is defined => try to login
            console.log('UserService.autoLogin(' + email + ', ' + password + '): login');
            return this.login(email, password);
        }

        // There is an email but no password
        // => ask the password to the user with a confirmation popup
        const sub = new Subject<ResponseWithData<User>>(); // use subject due to async actions
        from(this.alertCtrl.create({
            message: 'Please enter the password of the account \'' + email +  '\'.',
            inputs: [
                { name: 'password', type: 'password'},
                { name: 'savePassword', type: 'checkbox', label: 'Store password on device', value: 'true', checked: true }],
            buttons: [
                { text: 'Cancel', role: 'cancel',
                    handler: () => {
                        console.log('suject.next(null)');
                        sub.next({ error: null, data: null});
                        console.log('suject.complete()');
                        sub.complete();
                    }
                },
                { text: 'Login',
                    handler: (data: any) => {
                        // console.log('autoLogin: password=', data.password, 'save=', data.savePassword);
                        if (data.password && data.password.trim().length > 0) {
                            // try to login with the password
                            this.login(email, data.password).pipe(
                                map( (ruser) => {
                                    if (ruser.data) { // Login with success
                                        if (data.savePassword) {
                                            // The user is ok to store password in settings on local device
                                            this.appSettingsService.setLastUser(email, data.password);
                                        }
                                    } // else login fails
                                    console.log('suject.next(', ruser.data, ')');
                                    sub.next(ruser);
                                    console.log('suject.complete()');
                                    sub.complete();
                                })
                            ).subscribe();
                        } else {
                            // the user didn't provide a valid password
                            console.log('suject.next(null)');
                            sub.next({ error: null, data: null});
                            console.log('suject.complete()');
                            sub.complete();
                        }
                    }
                }
            ]
        }).then( (alert) => alert.present()));
        return sub;
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
