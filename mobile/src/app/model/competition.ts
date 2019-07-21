import { GameLevel } from './game';
import { GameCategory } from './../../../../firebase/functions/src/model/game';
import { PersistentData, DataRegion, HasId } from './common';
import { Referee } from '../../../../firebase/functions/src/model/user';
import { User } from './user';

export interface Competition extends PersistentData {
    name: string;
    date: Date;
    year: number;
    region: DataRegion;
    country: string;
    referees: {
        refereeId: string;
        refereeShortName: string;
    }[];
    refereeCoaches: {
        coachId: string;
        coachShortName: string;
    }[];
    allocations: GameAllocation[];
}
export interface GameAllocation extends HasId {
    date: Date;
    field: string;
    timeSlot: string;
    gameCategory: GameCategory;
    gameSpeed: GameLevel;
    gameSkill: GameLevel;
    referees: {
        /** Persistent identifier of the referee allocated on the game */
        refereeId: string;
        /** Short name of the referee allocated on the game */
        refereeShortName: string;
    }[];
    refereeCoaches: {
        /** Persistent identifier of the referee coach allocated on the game */
        coachId: string;
        /** Short name of the referee coach */
        coachShortName: string;
        /** Persistent identifier of the coaching peristent item */
        coachingId: string;
    }[];
}


export interface AnalysedImport<P extends HasId> extends HasId {
    /** Data to import */
    dataToImport: P;
    /** Persistent data found from database correspondaing to the data to import */
    dataFromDB: P;
    /** The line number of the data to import */
    lineNumber: number;
    /** the list of error detected during the analysis or the import of the data */
    errors: string[];
    /** flag indicating if the data can be imported */
    toImport: boolean;
}

/**
 * Define the internal structure representing a competition to import
 */
export interface AnalysedImportCompetition extends AnalysedImport<Competition> {
    gameAnalysis: AnalysedImport<GameAllocation>[];
    gameToImport: number;

    refereeAnalysis: AnalysedImport<Referee>[];
    refereeToImport: number;

    refereeCoachAnalysis: AnalysedImport<User>[];
    refereeCoachToImport: number;
}
