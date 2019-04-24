import { GameCategory, GameLevel } from './game';
import { PersistentData } from './common';

export type Upgradable = 'DNS' | 'DNSE'  | 'No' | 'Possible' | 'Yes';

export interface PRO {
    problemShortDesc: string;
    coachId: number;
    skillName: string;
    problem: string;
    remedy: string;
    outcome: string;
}
export interface PersistentPRO extends PRO, PersistentData {
}
export interface PROLink {
    id: number;
    problemShortDesc: string;
}
export interface Feedback extends PRO {
    priority: number;
    period: number;
    appliedLater: boolean;
    deliver: boolean;
}

export interface PositiveFeedback {
    skillName: string;
    description: string;
    period: number;
    deliver: boolean;
}

export interface Coaching extends PersistentData {
    competition: string;
    date: Date;
    field: string;
    timeSlot: string;
    coachId: number;
    gameCategory: GameCategory;
    gameSpeed: GameLevel;
    gameSkill: GameLevel;
    closed?: boolean;
    currentPeriod?: number;
    referees: {
        refereeId: number;
        refereeShortName: string;
        feedbacks: Feedback[];
        positiveFeedbacks: PositiveFeedback[];
        upgrade: Upgradable;
        rank: number;
    }[];
}

