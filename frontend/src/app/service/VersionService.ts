import { Injectable }           from '@angular/core';
import { Storage }              from '@ionic/storage';
import { Observable }           from 'rxjs/Rx';

import { LocalAppSettings }     from './../model/settings';
import { AppSettingsService }   from './AppSettingsService';

@Injectable()
export class VersionService {

    private applicationVersion = '1.0.0';

    constructor(
        protected appSettingsService: AppSettingsService,
        private storage: Storage,
    ) {}

    /**
     * Retrieves the current version of the application source code.
     */
    public getApplicationVersion(): string {
        return this.applicationVersion;
    }

    public migrate(): Observable<any> {
        return this.appSettingsService.get().map((local:LocalAppSettings) => {
            if (!local.applicationVersion || local.applicationVersion != this.applicationVersion) {
                //Perfom the migration steps
                console.log(`Perfom the migration steps from ${local.applicationVersion} to ${this.applicationVersion}.`);
            
                // initial to 1.0.0
                if (!local.applicationVersion) {
                    this.migrateInitialTo1_0_0();
                }

                //1.0.0 to ...


                // finally store the new version locally
                console.log(`Set locally new version to ${this.applicationVersion}`);
                this.appSettingsService.setApplicationVersion(this.applicationVersion);
            } else {
                console.log(`No migration tasks (current version is ${local.applicationVersion}).`);
            }
        });
    }

    /**
     * Applies changes in the local databases from the initial version to version 1.0.0
     */
    private migrateInitialTo1_0_0(): void {
        console.log("Migrating from Inital version to version 1.0.0");
        // Step 1: table renaming
        const tableNaming: string[][] = [
            ['users', 'user'],
            ['skillprofiles', 'skillprofile'],
            ['referees', 'referee']
        ];
        tableNaming.forEach( (tn:string[]) => {
            this.renameTable(tn[0], tn[1]);
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    /////////////////////////////// TOOL METHODS ///////////////////////////////
    ////////////////////////////////////////////////////////////////////////////

    /**
     * Renames a table from the local storage
     * @param oldTableName  is the old table name
     * @param newTableName  is the new table name
     */
    private renameTable(oldTableName:string, newTableName: string) {
        this.storage.get(oldTableName).then((data) => {
            if (data) {
                console.log("Migrating local table name '${oldTableName}' to '${newTableTable}' ...");
                this.storage.set(newTableName, data).then(() => {
                    this.storage.remove(oldTableName);
                });
            }
        });
    }
}