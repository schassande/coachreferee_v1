import { ResponseWithData } from './response';
import { Observable, of } from 'rxjs';
import { LocalAppSettings } from './../model/settings';
import { HttpClient } from '@angular/common/http';
import { SynchroService } from './SynchroService';
import { LocalDatabaseService } from './LocalDatabaseService';
import { ConnectedUserService } from './ConnectedUserService';
import { AppSettingsService } from './AppSettingsService';
import { Injectable } from '@angular/core';
import { User } from './../model/user';
import { RemotePersistentDataService } from './RemotePersistentDataService';
import { flatMap, map } from 'rxjs/operators';

@Injectable()
export class UserService  extends RemotePersistentDataService<User> {

    public currentUser: User = null;

    constructor(
        protected appSettingsService: AppSettingsService,
        protected connectedUserService: ConnectedUserService,
        protected localDatabaseService: LocalDatabaseService,
        protected synchroService: SynchroService,
        protected http: HttpClient
    ) {
        super(appSettingsService, connectedUserService, localDatabaseService, synchroService, http);
    }

    getLocalStoragePrefix(): string {
        return 'user';
    }

    getPriority(): number {
        return 1;
    }

    protected adjustBeforeSyncBack(dataNew: User, dataOld: User) {
        if (dataOld && dataNew.password == null && dataOld.password) {
            dataNew.password = dataOld.password;
        }
        return dataNew;
    }

    public login(email: string, password: string, obs: Observable<any> = of('')): Observable<ResponseWithData<User>> {
        console.log('UserService.login(' + email + ')');
        return this.remoteAfterHttp(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap((localAppSettings: LocalAppSettings) => {
                return this.http.post(`${localAppSettings.serverUrl}${this.getResourceUrlPath()}/login`,
                    {email, password},
                    this.connectedUserService.getRequestOptions(localAppSettings));
            }),
            map((response: any) => {
                // The login service already store data fields into a data field and not at the root document
                if (response.data) {
                    response.data = response.data.data;
                }
                return response;
            }),
            map((response: any) => {
                if (response.data) {
                    this.connectedUserService.userConnected(response.data);
                }
                return response;
            })
        ));
    }

    public getUrlPathOfGet(id: number) {
        return '?id=' + id;
    }

    public getByEmail(email: string): Observable<ResponseWithData<User>> {
        if (!email) {
            return of({data: null, error: null});
        }
        return this.syncIfOnline().pipe(
            flatMap((online: boolean) => {
                return online ? this.remoteGetByEmail(email) : this.localGetByEmail(email);
            })
        );
    }
    public localGetByEmail(email: string, obs: Observable<any> = of('')): Observable<ResponseWithData<User>> {
        console.log('UserService.localGetByEmail(' + email + ')');
        return this.localAll(obs).pipe(
            map( (response: ResponseWithData<User[]>) => {
                const users = response.data.filter(user => user.email === email);
                if (users.length > 0) {
                    return { data : users[0], error: null};
                }
            })
        );
    }
    private remoteGetByEmail(email: string, obs: Observable<any> = of('')): Observable<ResponseWithData<User>> {
        console.log('UserService.remoteGetByEmail(' + email + ')');
        return this.remoteAfterHttp(obs.pipe(
            flatMap(() => this.appSettingsService.get()),
            flatMap( (localAppSettings: LocalAppSettings) => {
                return this.http.get<User>(`${localAppSettings.serverUrl}${this.getResourceUrlPath()}/${email}`,
                    this.connectedUserService.getRequestOptions(localAppSettings));
            }))
        );
    }
}
