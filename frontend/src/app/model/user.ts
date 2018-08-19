import { PersistentData } from './common';
import { GameCategory } from './game';

export type RefereeCoachLevel = 'NONE' | 'EURO_1' | 'EURO_2' | 'EURO_3' |'EURO_4' |'EURO_5' | 'NZ_1' | 'NZ_2' | 'NZ_3' |'NZ_4' |'AUS_1' | 'AUS_2' | 'AUS_3';
export type RefereeLevel =  '' | 'EURO_0' |'EURO_1' | 'EURO_2' | 'EURO_3' |'EURO_4' |'EURO_5' | 'NZ_1' | 'NZ_2' | 'NZ_3' |'NZ_4' |'AUS_1' | 'AUS_2' | 'AUS_3' | 'AUS_4' | 'AUS_5' | 'AUS_6';

export type Gender = 'M' | 'F'; 
export type RefereeCategory = 'OPEN' | 'SENIOR'; 
 
export interface Photo {
     id: number;
     url: string;
 }
export interface Person extends PersistentData {
    firstName?: string;
    lastName?: string;
    shortName?: string;
    birthday?: Date;
    country?: string;
    email?: string;
    gender?: Gender;
    mobilePhones?: string[];
    photo?: Photo;
    speakingLanguages?: string[];
}

export interface Referee extends Person {
    referee ? : {
        refereeLevel: RefereeLevel;
        refereeCategory : RefereeCategory;
        nextRefereeLevel: RefereeLevel;
    };
    refereeCoach ? : {
        refereeCoachLevel: RefereeCoachLevel;
    };
}

export interface User extends Referee {
    password?: string;
    token? :string;
    defaultCompetition: string;
    defaultGameCatory: GameCategory;
}