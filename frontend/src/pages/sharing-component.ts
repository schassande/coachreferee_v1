import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Component, Input, forwardRef } from '@angular/core';
import { Sharing } from "../app/model/privacy";

@Component({
    selector: 'sharing-comp',
    template: `<ion-segment class="sharingSegment" [(ngModel)]="value">
                    <ion-segment-button class="sharingYes" value="YES"  ><ion-icon name="checkmark"></ion-icon></ion-segment-button>
                    <ion-segment-button class="sharingLimit"  value="LIMIT"><ion-icon name="help"></ion-icon></ion-segment-button>
                    <ion-segment-button class="sharingNo"  value="NO"   ><ion-icon name="close"></ion-icon></ion-segment-button>
                </ion-segment>`,
    providers: [ { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SharingComponent), multi: true } ],
    styles: [`
    .sharingSegment .segment-button { 
        background-color: lightblue;
        color: black;
        border: none;
    }
    .sharingSegment .segment-button.sharingYes.activated,
    .sharingSegment .segment-button.sharingYes.segment-activated {
        background-color: lightgreen;
    }
    .sharingSegment .segment-button.sharingLimit.activated,
    .sharingSegment .segment-button.sharingLimit.segment-activated {
        background-color: #488aff;
    }
    .sharingSegment .segment-button.sharingNo.activated,
    .sharingSegment .segment-button.sharingNo.segment-activated {
        background-color: orangered;
    }
    `]
  })
export class SharingComponent implements ControlValueAccessor {
    
    @Input() 
    public name: string;
    @Input('value') 
    public val: Sharing;

    // Both onChange and onTouched are functions. Set default function doing NOP
    private onChange: any = () => { };
    private onTouched: any = () => { };

    get value():Sharing {
        return this.val;
    }

    set value(val:Sharing) {
        this.val = val;
        this.onChange(val);
        this.onTouched();
    }

    // We implement this method to keep a reference to the onChange
    // callback function passed by the forms API
    registerOnChange(fn) {
        this.onChange = fn;
    }

    // We implement this method to keep a reference to the onTouched
    //callback function passed by the forms API
    registerOnTouched(fn) {
        this.onTouched = fn;
    }

    // This is a basic setter that the forms API is going to use
    writeValue(value) {
        if (value) {
            this.value = value;
        }
    }
}