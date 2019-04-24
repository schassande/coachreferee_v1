import { Assessment, SkillSetEvaluation } from './../model/assessment';
import { ModifiableData } from './LocalDatabaseService';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs';

import { LocalAppSettings } from './../model/settings';
import { AppSettingsService } from './AppSettingsService';
import { map } from 'rxjs/operators';

@Injectable()
export class VersionService {

    private applicationVersion = '1.2.0';

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
        return this.appSettingsService.get().pipe(
            map((local: LocalAppSettings) => {
                if (!local.applicationVersion || local.applicationVersion !== this.applicationVersion) {
                    // Perfom the migration steps
                    console.log(`Perfom the migration steps from ${local.applicationVersion} to ${this.applicationVersion}.`);

                    // initial to 1.0.0
                    if (!local.applicationVersion) {
                        local.applicationVersion = this.migrateInitialTo100();
                    }

                    // 1.0.0 to ... 1.1.0
                    if (local.applicationVersion === '1.0.0') {
                        local.applicationVersion = this.migrateInitialFrom100To110();
                    }

                    // 1.1.0 to ... 1.2.0
                    if (local.applicationVersion === '1.1.0') {
                        local.applicationVersion = this.migrateInitialFrom110To120();
                    }

                    // finally store the new version locally
                    console.log(`Set locally new version to ${this.applicationVersion}`);
                    this.appSettingsService.setApplicationVersion(this.applicationVersion);
                } else {
                    console.log(`No migration tasks (current version is ${local.applicationVersion}).`);
                }
            })
        );
    }

    /**
     * Applies changes in the local databases from the initial version to version 1.0.0
     */
    private migrateInitialTo100(): string {
        console.log('Migrating from Inital version to version 1.0.0');
        // Step 1: table renaming
        const tableNaming: string[][] = [
            ['users', 'user'],
            ['skillprofiles', 'skillprofile'],
            ['referees', 'referee']
        ];
        tableNaming.forEach( (tn: string[]) => {
            this.renameTable(tn[0], tn[1]);
        });
        return '1.0.0';
    }

    /**
     * Applies changes in the local databases from the version 1.0.0 to version 1.1.0
     */
    private migrateInitialFrom100To110(): string {
        // TODO sharing
        this.setNewFieldInTable('coaching', 'closed', false);
        return '1.1.0';
    }

    private migrateInitialFrom110To120(): string {
        const tableName = 'assessment';
        // add the field competency
        this.storage.get(tableName).then((md: ModifiableData<any>) => {
            if (md) {
                md.modified.forEach((obj) => this.addCompetencyField(obj));
                md.removed.forEach((obj) => this.addCompetencyField(obj));
                md.unmodified.forEach((obj) => this.addCompetencyField(obj));
                this.storage.set(tableName, md);
            }
        });
        return '1.2.0';
    }

    private addCompetencyField(assessment: Assessment) {
        if (!assessment.competency) {
            assessment.competency = assessment.competent ? 'YES' : 'NO';
        }
        delete assessment.competent;
        assessment.skillSetEvaluation.forEach( (skillSetEval: SkillSetEvaluation) => {
            if (!skillSetEval.competency) {
                skillSetEval.competency = skillSetEval.competent ? 'YES' : 'NO';
            }
            delete skillSetEval.competent;
            skillSetEval.skillEvaluations.forEach( (skillEval) => {
                if (!skillEval.competency) {
                    skillEval.competency = skillEval.competent ? 'YES' : 'NO';
                }
                delete skillEval.competent;
            });
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
    private renameTable(oldTableName: string, newTableName: string) {
        this.storage.get(oldTableName).then((data) => {
            if (data) {
                console.log(`Migrating local table name '${oldTableName}' to '${newTableName}' ...`);
                this.storage.set(newTableName, data).then(() => {
                    this.storage.remove(oldTableName);
                });
            }
        });
    }

    private setNewFieldInTable(tableName: string, fieldName: string, defaultValue) {
        this.setNewFieldInTableFromFn(tableName, fieldName, () => defaultValue);
    }

    private setNewFieldInTableFromFn(tableName: string, fieldName: string, valueProvider) {
        this.storage.get(tableName).then((md: ModifiableData<any>) => {
            if (md) {
                md.modified.forEach((obj) => this.setNewFieldInObjectFromFn(obj, fieldName, valueProvider));
                md.removed.forEach((obj) => this.setNewFieldInObjectFromFn(obj, fieldName, valueProvider));
                md.unmodified.forEach((obj) => this.setNewFieldInObjectFromFn(obj, fieldName, valueProvider));
                this.storage.set(tableName, md);
            }
        });
    }

    private setNewFieldInObjectFromFn(obj, fieldPath: string, valueProvider) {
        if (!obj || !fieldPath || fieldPath.length === 0) {
            console.log('ERROR VersionService.setNewFieldInObject(', obj, fieldPath, '): invalid parameter.');
            return;
        }
        let currentObj: any = obj;
        fieldPath.split('.').forEach((fieldName: string, idx: number, names: string[]) => {
            if (!currentObj[fieldName]) {
                // Current field name is not defined.
                if (idx === (names.length - 1)) {
                    // It is the last element => set the default value
                    currentObj[fieldName] = valueProvider(currentObj);
                } else {
                    // It is an intermediate node => set an empty document.
                    currentObj[fieldName] = {};
                }
            }
            // recurse
            currentObj = currentObj[fieldName];
        });
    }
}
