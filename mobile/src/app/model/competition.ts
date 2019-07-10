import { PersistentData, DataRegion } from './common';

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
}
