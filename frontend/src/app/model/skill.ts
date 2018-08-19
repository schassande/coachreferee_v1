import { PROLink } from './coaching';
import { PersistentData } from './common';


export type EvaluationRequirement = 'ALL_REQUIRED' | 'MAJORITY_REQUIRED';
export interface Defintion {
    name: string;
    description: string;
}
export interface Skill extends Defintion {
    proLinks: PROLink[];
    required: boolean;
}
export interface SkillSet extends Defintion {
    skills: Skill[];
    requirement: EvaluationRequirement;
    required: boolean;
}
export interface SkillProfile extends Defintion, PersistentData {
    skillSets: SkillSet[];
    requirement: EvaluationRequirement;
}
