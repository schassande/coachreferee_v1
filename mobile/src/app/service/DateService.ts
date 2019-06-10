import { Injectable } from '@angular/core';

const DATE_SEP = '-';

@Injectable()
export class DateService {

    public date2string(aDate: Date) {
        return aDate.getFullYear()
          + DATE_SEP + this.to2Digit(aDate.getMonth() + 1)
          + DATE_SEP + this.to2Digit(aDate.getDate());
    }

    public string2date(dateStr: string, aDate: Date): Date {
        const elements = dateStr.split(DATE_SEP);
        if (!aDate) {
            aDate = new Date();
        }
        aDate.setFullYear(Number.parseInt(elements[0], 0));
        aDate.setMonth(Number.parseInt(elements[1], 0) - 1);
        aDate.setDate(Number.parseInt(elements[2], 0));
        return aDate;
    }

    public to2Digit(nb: number): string {
        return (nb < 10 ? '0' : '') + nb;
    }
}
