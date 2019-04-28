import { Component, Input, forwardRef, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

@Component({
    selector: 'camera-icon-comp',
    template: `
        <span *ngIf="visible" style="margin: 0 5px;">
            <input type="file" id="inputPhoto" #inputPhoto accept="image/*;capture=camera"
                style="display: none;" capture="camera" (change)="onImage($event)" />
            <ion-icon slot="{{slot}}" name="camera" size="large" class="cameraButton" (click)="openPhoto(inputPhoto)"></ion-icon>
        </span>`,
  })
export class CameraIconComponent  {

    @Input()
    public visible = true;
    @Input()
    public slot = 'end';
    @Output()
    public photo: EventEmitter<any> = new EventEmitter();

    image: any = null;
    @ViewChild('inputPhoto') inputPhoto: ElementRef;

    openPhoto() {
        this.inputPhoto.nativeElement.click();
    }

    onImage(event) {
        console.log('onImage(', event, '): image=', this.image);
        this.photo.emit(this.image);
    }
}
