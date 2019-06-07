import { PersistentData } from './common';

/** Class of the competition event */
export type EventClass = 'A' | 'B' | 'C' | 'D';

/** Description of the referee allocation job */
export type RefereeAllocation =
    /** The coach does not allocate the referees on game */
    'No'
    /** The coach contribute to the rreferee allocation */
    | 'Contribute'
    /** The coach fully participate to the refeee allocation */
    | 'Yes';

export interface CoachingHistory extends PersistentData {
    /** Identifier of the coach */
    coachId: string;
    /** Name of the event */
    eventName: string;
    /** Class of the event */
    eventClass: EventClass;
    days: CoachingDay[];
}
export interface CoachingDay {
    /** Date of the coaching */
    coachingDate: Date;
    /** Duration of the game in minutes */
    gameDuration: number;
    /** Number of minute of coached game during the event */
    coachingDuration: number;
    refereeAllocation: RefereeAllocation;
}
