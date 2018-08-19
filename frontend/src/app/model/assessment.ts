import { GameCategory, GameLevel } from './game';
import { PersistentData } from './common';
import { Skill } from './skill';

export interface Evaluation {
    competent: boolean;
    comment: string;
}
export interface SkillEvaluation extends Skill, Evaluation {
}
export interface SkillSetEvaluation extends Evaluation {
    skillSetName: string;
    skillEvaluations: SkillEvaluation[];
}
export interface SkillProfileEvaluation extends Evaluation {
    profileId: number;
    skillSetEvaluation: SkillSetEvaluation[];
}

export interface Assessment extends SkillProfileEvaluation, PersistentData {
    competition: string
    date: Date;
    field: string;
    timeSlot: string;
    coachId: number;
    gameCategory: GameCategory;
    gameSpeed: GameLevel;
    gameSkill: GameLevel;
    refereeId: number;
}
