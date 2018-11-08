import { CoachDataSharingAgreement, RefereeDataSharingAgreement } from './privacy';
import { PersistentData } from './common';
import { GameCategory } from './game';

export type RefereeCoachLevel = 'NONE' | 'EURO_0' | 'EURO_1' | 'EURO_2' | 'EURO_3' |'EURO_4' |'EURO_5' | 'NZ_1' | 'NZ_2' | 'NZ_3' |'NZ_4' |'AUS_1' | 'AUS_2' | 'AUS_3';
export const REFEREE_COACH_LEVELS = [ 'NONE' , 'EURO_0' , 'EURO_1' , 'EURO_2' , 'EURO_3' ,'EURO_4' ,'EURO_5' , 'NZ_1' , 'NZ_2' , 'NZ_3' ,'NZ_4' ,'AUS_1' , 'AUS_2' , 'AUS_3' ];
export type RefereeLevel =  '' | 'EURO_0' |'EURO_1' | 'EURO_2' | 'EURO_3' |'EURO_4' |'EURO_5' | 'NZ_1' | 'NZ_2' | 'NZ_3' |'NZ_4' |'AUS_1' | 'AUS_2' | 'AUS_3' | 'AUS_4' | 'AUS_5' | 'AUS_6';
export const REFEREE_LEVELS =  ['' , 'EURO_0' ,'EURO_1' , 'EURO_2' , 'EURO_3' ,'EURO_4' ,'EURO_5' , 'NZ_1' , 'NZ_2' , 'NZ_3' ,'NZ_4' ,'AUS_1' , 'AUS_2' , 'AUS_3' , 'AUS_4' , 'AUS_5' , 'AUS_6' ];

export type Gender = 'M' | 'F'; 
export type RefereeCategory = 'OPEN' | 'SENIOR'; 
export interface Photo {
     id: number;
     url: string;
 }

 /** List of countries [0] is the internal name, [1] is the viewed name. */
export const COUNTRIES: string[][] = [ 
    ['AUS', 'Australia'],
    ['Austria', 'Austria'],
    ['Belgium', 'Belgium'],
    ['England', 'England'],
    ['France', 'France'],
    ['Germany', 'Germany'],
    ['Guernesey', 'Guernesey'],
    ['Ireland', 'Ireland'],
    ['Italy', 'Italy'],
    ['Jersey', 'Jersey'],
    ['Japan', 'Japan'],
    ['Luxembourg', 'Luxembourg'],
    ['Netherlands', 'Netherlands'],
    ['New Zeleand', 'New Zeleand'],
    ['Portugal', 'Portugal'],
    ['Scotland', 'Scotland'],
    ['Singapore', 'Singapore'],
    ['Spain', 'Spain'],
    ['switzerland', 'Switzerland'],
    ['USA', 'USA'],
    ['Wales', 'Wales'],
    ['Other', 'Other']
];
export const LANGUAGES: string[][] = [ 
    ["EN",'English'],
    ["FR",'French'],
    ["DE",'Deutsch'],
    ["ES",'Spanish'],
    ["IT",'Italian'],
    ["PO",'Portuguese']
];

export const CONSTANTES = {
    countries: COUNTRIES,
    languages: LANGUAGES,
    refereeCoachLevels: REFEREE_COACH_LEVELS,
    refereeLevels: REFEREE_LEVELS
}


export interface Person extends PersistentData {
    firstName?: string;
    lastName?: string;
    shortName?: string;
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
    dataSharingAgreement?: RefereeDataSharingAgreement;
}

export interface User extends Referee {
    password?: string;
    token? :string;
    defaultCompetition: string;
    defaultGameCatory: GameCategory;
    dataSharingAgreement?: CoachDataSharingAgreement;
}