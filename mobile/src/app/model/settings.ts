import { Coaching, PersistentPRO } from './coaching';
import { Assessment } from './assessment';
import { User, Referee } from './user';
import { SkillProfile } from './skill';

export interface LocalAppSettings {
    serverUrl: string;
    minNetworkConnectionForSyncho: NetworkConnection;
    forceOffline?: boolean;
    lastUserEmail: string;
    lastUserPassword: string;
    applicationVersion?: string;
    apiKey?: string;
}
export type NetworkConnection = 'UNKNOWN' | 'NONE'| '3G' | '4G' | 'WIFI' | 'WIRED';

export interface ExportedData {
    users?: User[];
    referees?: Referee[];
    skillProfiles?: SkillProfile[];
    pros?: PersistentPRO[];
    coachings?: Coaching[];
    assessments?: Assessment[];
}
