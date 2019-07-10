import { PersistentData } from './common';

export interface Competition extends PersistentData {
    name: string;
    date: Date;
    year: number;
    region: string;
    country: string;
    referees: {
        refereeId: string;
        refereeShortName: string;
    }[];
}
