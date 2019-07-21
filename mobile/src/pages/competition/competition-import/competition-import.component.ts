import { CompetitionService } from './../../../app/service/CompetitionService';
import { Competition, GameAllocation, AnalysedImport, AnalysedImportCompetition } from './../../../app/model/competition';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RefereeService } from '../../../app/service/RefereeService';
import { UserService } from './../../../app/service/UserService';

import * as csv from 'csvtojson';
import { Observable, of, concat } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { DateService } from 'src/app/service/DateService';
import { Referee, User } from './../../../app/model/user';
import { ResponseWithData } from 'src/app/service/response';

@Component({
  selector: 'app-competition-import',
  templateUrl: './competition-import.component.html',
  styleUrls: ['./competition-import.component.scss'],
})
export class CompetitionImportComponent implements OnInit {

  @ViewChild('inputCompetition') inputCompetition: ElementRef;
  importedDatas: AnalysedImportCompetition = null;
  analysisStatus: 'NONE' | 'ANALYSING' | 'ANALYSED' = 'NONE';
  importStatus: 'NONE' | 'IMPORTING' | 'IMPORTED' = 'NONE';
  showImportButton = false;
  nbError = 0;
  updateExisting = true;
  removeUnreferenced = false;

  constructor(
    private competitionService: CompetitionService,
    private dateService: DateService,
    private refereeService: RefereeService,
    private userService: UserService
  ) { }

  ngOnInit() {
  }

  loadFile() {
    this.inputCompetition.nativeElement.click();
  }

  importCompetitionFromCsv(event) {
    this.analayse(event.target.files[0]);
  }

  private analayse(file) {
    this.analysisStatus = 'ANALYSING';
    this.importedDatas = {
      id: null,
      dataToImport: null,
      dataFromDB: null,
      lineNumber: null,
      errors: [],
      toImport: false,
      gameAnalysis : [],
      gameToImport: 0,
      refereeAnalysis: [],
      refereeToImport: 0,
      refereeCoachAnalysis: [],
      refereeCoachToImport: 0
    };
    const reader: FileReader = new FileReader();
    let lineNumber = 1;
    reader.onloadend = () => {
      csv({ output: 'json', trim: true, noheader: false, delimiter: ',', ignoreEmpty: true, checkType: false})
        .fromString(reader.result as string).then((jsons) => {
          let obs: Observable<AnalysedImport<GameAllocation>> = of (null);
          jsons.forEach( (json, idx) => {
            lineNumber++;
            // console.log(`analyse file line ${lineNumber}`);
            // console.log('json=' + JSON.stringify(json, null, 2));
            obs = obs.pipe(flatMap(() => this.analyseGame(json, lineNumber)));
          });
          obs.subscribe(() => {
            this.nbError = this.getNbError();
            this.showImportButton = this.nbError === 0;
            this.analysisStatus = 'ANALYSED';
            console.log('Analysis completed:', this.importedDatas);
          });
        });
    };
    reader.readAsText(file);
  }

  private getNbError(): number {
    return this.importedDatas.errors.length
      + this.importedDatas.refereeAnalysis.filter( (a) => a.errors.length > 0).length
      + this.importedDatas.refereeCoachAnalysis.filter( (a) => a.errors.length > 0).length
      + this.importedDatas.gameAnalysis.filter( (a) => a.errors.length > 0).length;
  }


  private analyseGame(jsonGame, lineNumber: number): Observable<AnalysedImport<GameAllocation>> {
    // console.log(`analyseGame(${lineNumber})`);
    let iag: AnalysedImport<GameAllocation> = null;
    return this.analyseCompetition(jsonGame, lineNumber).pipe(
      map((comp) => {
        iag = this.newAnalysedImportGameAllocation(lineNumber);
        if (!jsonGame.gameId || !jsonGame.gameId.trim()) {
          iag.errors.push('The game id is missing.');
        } else {
          iag.dataToImport.id = jsonGame.gameId.trim();
          iag.id = iag.dataToImport.id;
          // check if the game id is not already used
          const iags = this.importedDatas.gameAnalysis.filter((ga) => ga.id === iag.id);
          if (iags.length) {
            iag.errors.push(`The game line ${iag.lineNumber} has the same identifier ${iag.id} than the game line ${iags[0].lineNumber}`);
          }
        }
        if (comp && comp.allocations && iag.dataToImport.id) {
          const allocs = comp.allocations.filter( (alloc) => alloc.id === iag.dataToImport.id);
          if (allocs.length) {
            iag.dataFromDB = allocs[0];
            Object.assign(iag.dataToImport, iag.dataFromDB);
          }
        }
        this.analyseGameAttributes(jsonGame, iag);
        this.importedDatas.gameAnalysis.push(iag);
        this.importedDatas.dataToImport.allocations.push(iag.dataToImport);
        return '';
      }),
      flatMap(() => this.analyseReferee(jsonGame.referee1, iag)),
      flatMap(() => this.analyseReferee(jsonGame.referee2, iag)),
      flatMap(() => this.analyseReferee(jsonGame.referee3, iag)),
      flatMap(() => this.analyseRefereeCoach(jsonGame.refereeCoach1, iag)),
      flatMap(() => this.analyseRefereeCoach(jsonGame.refereeCoach2, iag)),
      flatMap(() => this.analyseRefereeCoach(jsonGame.refereeCoach3, iag)),
      map(() => iag)
    );
  }

  private analyseCompetition(jsonGame, lineNumber: number): Observable<Competition> {
    // console.log(`analyseCompetition(${lineNumber})`);
    if (!jsonGame.competition || !jsonGame.competition.trim()) {
      this.importedDatas.errors.push('Competition name is missing on line ' + lineNumber);
      throw null;
    }
    if (this.importedDatas.dataToImport) {
      // the competition has been already set => compare it is the same name
      if (this.importedDatas.dataToImport.name !== jsonGame.competition) {
        this.importedDatas.errors.push('Different competition name on line ' + lineNumber);
        throw null;
      }
      // console.log(`analyseCompetition(${lineNumber}): the competition has been already set`);
      return of(this.importedDatas.dataToImport);
    } else {
      // console.log(`analyseCompetition(${lineNumber}): the competition has not been already set`);
      // first line
      this.importedDatas.dataToImport = {
        id: null,
        version: 0,
        creationDate : new Date(),
        lastUpdate : new Date(),
        dataStatus: 'NEW',
        name: jsonGame.competition,
        date: new Date(),
        year: new Date().getFullYear(),
        region : 'Others',
        country : '',
        referees: [],
        refereeCoaches: [],
        allocations: []
      };
      // search the competition from DB
      return this.competitionService.getCompetitionByName(jsonGame.competition).pipe(
        map((rcomp) => {
          this.importedDatas.dataFromDB = rcomp.data;
          if (this.importedDatas.dataFromDB) {
            Object.assign(this.importedDatas.dataToImport, this.importedDatas.dataFromDB);
            // console.log(`analyseCompetition(${lineNumber}): the competition found from DB: ${this.importedDatas.dataFromDB.id}`);
          } else {
            // console.log(`analyseCompetition(${lineNumber}): the competition does not exist`);
          }
          return this.importedDatas.dataToImport;
        })
      );
    }
  }

  private analyseReferee(refereeShortName: string, iag: AnalysedImport<GameAllocation>): Observable<any> {
    // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}`);
    if (!refereeShortName || !refereeShortName.trim()) {
      return of('');
    }
    const refs = this.importedDatas.dataToImport.referees.filter((refe) => refe.refereeShortName === refereeShortName);
    if (refs.length) {
      // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}: Referee already in competition (1)`);
      iag.dataToImport.referees.push(refs[0]);
      return of('');
    }
    const ref = {refereeShortName: refereeShortName.trim(), refereeId: null};
    iag.dataToImport.referees.push(ref);
    this.importedDatas.dataToImport.referees.push(ref);
    // search if the referee has been already found
    const refAnas: AnalysedImport<Referee>[] = this.importedDatas.refereeAnalysis.filter(
      (refAna) => refAna.id === refereeShortName);
    if (refAnas.length === 0) {
      // It is the first time this referee is allocation on a game
      const refAna: AnalysedImport<Referee> = {
        id: ref.refereeShortName,
        dataToImport: null,
        dataFromDB: null,
        lineNumber: iag.lineNumber,
        errors: [],
        toImport: false
      };
      this.importedDatas.refereeAnalysis.push(refAna);
      return this.refereeService.findByShortName(ref.refereeShortName).pipe(
        map((rref) => {
          if (rref.data.length) {
            refAna.dataFromDB = rref.data[0];
            ref.refereeId = refAna.dataFromDB.id;
            // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}: Referee exists (1)`);
          } else {
            refAna.errors.push(`Referee ${refereeShortName} does not exist (line ${iag.lineNumber}).`);
            // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}: the referee does not exists (1)`);
          }
        })
      );
    } else if (refAnas[0].dataFromDB) {
      // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}: Referee exists (2)`);
      // the referee has been already found and the referee already exists
      ref.refereeId = refAnas[0].dataFromDB.id;
    } else {
      // console.log(`analyseReferee(${refereeShortName}) line: ${iag.lineNumber}: the referee does not exists (2)`);
      // The referee does not exist but it is not the first the problem is detected
      refAnas[0].errors.push(`Referee ${refereeShortName} does not exist (line ${iag.lineNumber}).`);
    }
    return of('');
  }

  private analyseRefereeCoach(refereeCoachShortName: string, iag: AnalysedImport<GameAllocation>): Observable<any> {
    // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber}`);
    if (!refereeCoachShortName || !refereeCoachShortName.trim()) {
      return of('');
    }
    const refs = this.importedDatas.dataToImport.refereeCoaches.filter((c) => c.coachShortName === refereeCoachShortName);
    if (refs.length) {
      // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber}: Referee Coach already in competition (1)`);
      iag.dataToImport.refereeCoaches.push({ coachId: refs[0].coachId, coachShortName: refs[0].coachShortName, coachingId: null });
      return of('');
    }
    const coach = { coachShortName: refereeCoachShortName.trim(), coachId: null, coachingId: null};
    iag.dataToImport.refereeCoaches.push(coach);
    this.importedDatas.dataToImport.refereeCoaches.push(coach);
    // search if the referee has been already found
    const coachAnas: AnalysedImport<User>[] = this.importedDatas.refereeCoachAnalysis.filter(
      (coachAna) => coachAna.id === refereeCoachShortName);
    if (coachAnas.length === 0) {
      // It is the first time this referee is allocation on a game
      const coachAna: AnalysedImport<User> = {
        id: coach.coachShortName,
        dataToImport: null,
        dataFromDB: null,
        lineNumber: iag.lineNumber,
        errors: [],
        toImport: false
      };
      return this.userService.findByShortName(coach.coachShortName).pipe(
        map((ruser: ResponseWithData<User[]>) => {
          if (ruser.data.length) {
            coachAna.dataFromDB = ruser.data[0];
            coach.coachId = coachAna.dataFromDB.id;
            // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber} coach exists (1).`);
          } else {
            coachAna.errors.push(`Coach ${refereeCoachShortName} does not exist (line ${iag.lineNumber}).`);
            // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber} coach does not exist (1).`);
          }
          this.importedDatas.refereeCoachAnalysis.push(coachAna);
        })
      );
    } else if (coachAnas[0].dataFromDB) {
      // the referee has been already found and the referee already exist
      coach.coachId = coachAnas[0].dataFromDB.id;
      // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber} coach exists (2).`);
    } else {
      // The referee does not exist but it is not the first the problem is detected
      coachAnas[0].errors.push(`Coach ${refereeCoachShortName} does not exist (line ${iag.lineNumber}).`);
      // console.log(`analyseRefereeCoach(${refereeCoachShortName}) line: ${iag.lineNumber} coach does not exist (2).`);
    }
    return of('');
  }

  private newAnalysedImportGameAllocation(lineNumber: number): AnalysedImport<GameAllocation> {
    return {
      id: null,
      dataToImport: {
        id: null,
        date: new Date(),
        field: '1',
        timeSlot: '00:00',
        gameCategory: 'OPEN',
        gameSpeed: 'Medium',
        gameSkill: 'Medium',
        referees: [],
        refereeCoaches: []
      },
      dataFromDB: null,
      lineNumber,
      errors: [],
      toImport: true
    };
  }

  private analyseGameAttributes(jsonGame: any, iag: AnalysedImport<GameAllocation>) {
    console.log(`analyseGameAttributes() line: ${iag.lineNumber}`);

    if (!jsonGame.field || !jsonGame.field.trim()) {
      iag.errors.push('The game field number is missing.');
    } else {
      iag.dataToImport.field = jsonGame.field.trim();
    }

    if (!jsonGame.timeSlot || !jsonGame.timeSlot.trim()) {
      iag.errors.push('The game timeSlot is missing.');
    } else {
      iag.dataToImport.timeSlot = jsonGame.timeSlot.trim();
    }

    if (!jsonGame.date || !jsonGame.date.trim()) {
      iag.errors.push('The game date is missing.');
    } else {
      try {
        const str: string = jsonGame.date.trim().replace('/', '-').replace('/', '-').replace('\\', '-').replace('\\', '-');
        const res = this.dateService.string2date(str, iag.dataToImport.date);
        if (res instanceof Date) {
          // console.log(`dateService.string2date(${str})=> ${res}    OK`);
          iag.dataToImport.date = res as Date;
        } else {
          // console.log(`dateService.string2date(${str})=> ${res}    ERROR`);
          iag.errors.push(res);
        }
      } catch (err) {
        iag.errors.push(err);
      }
    }
  }
}

