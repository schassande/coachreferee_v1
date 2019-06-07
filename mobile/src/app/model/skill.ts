import { PROLink } from './coaching';
import { PersistentData } from './common';
import { RefereeLevel } from './user';


export type EvaluationRequirement = 'ALL_REQUIRED' | 'MAJORITY_REQUIRED';
export interface Defintion {
    name: string;
    description: string;
}
export interface Skill extends Defintion {
    proLinks: PROLink[];
    required: boolean;
    maxPoints?: number;
}
export interface SkillSet extends Defintion {
    skills: Skill[];
    requirement: EvaluationRequirement;
    required: boolean;
    requiredPoints?: number;
}
export interface SkillProfile extends Defintion, PersistentData {
    skillSets: SkillSet[];
    requirement: EvaluationRequirement;
    backgroundColor?: string;
    color?: string;
    level?: RefereeLevel;
    requiredPoints?: number;
}
