import { flatMap, map, catchError } from 'rxjs/operators';
import { Subject, Observable, from, of } from 'rxjs';
import { Component, Input, forwardRef, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { AngularFireStorage } from 'angularfire2/storage';
import { ToastController } from '@ionic/angular';

export interface PhotoEvent {
    url: string;
    error: any;
}

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
    @Input()
    public  storageDirectory = 'photos';
    @Output()
    public photo: EventEmitter<PhotoEvent> = new EventEmitter<PhotoEvent>();
    @Input()
    public userAlert = false;

    image: any = null;
    @ViewChild('inputPhoto') inputPhoto: ElementRef;

    constructor(
        private afStorage: AngularFireStorage,
        private toastController: ToastController) {}

    openPhoto() {
        this.inputPhoto.nativeElement.click();
    }

    onImage(event) {
        this.uploadImage(event.target.files[0]);
    }

    private encodeImageUri(imageUri): Observable<string> {
        const reader: FileReader = new FileReader();
        reader.readAsDataURL(imageUri);
        return Observable.create((observer) => {
           reader.onloadend = () => {
              observer.next(reader.result);
              observer.complete();
           };
        });
    }

    uploadImage(imageURI) {
        this.encodeImageUri(imageURI).pipe(
            flatMap( (image64) => {
                console.log('uploadImage: image64=', image64);
                const fileName = `${new Date().getTime()}.jpg`;
                const upload =  this.afStorage.ref(`${this.storageDirectory}/${fileName}`);
                    // Perhaps this syntax might change, it's no error here!
                return from(upload.putString(image64).then().then());
            }),
            map( (snapshot) => {
                console.log('uploadImage: snapshot=', snapshot);
                if (this.userAlert) {
                    this.toastController.create({ message: 'Photo saved.', duration: 3000 })
                        .then((toast) => toast.present());
                }
                this.photo.emit({ url: snapshot.downloadURL, error: null });
            }),
            catchError( (err, caught) => {
                console.log('uploadImage: err=', err);
                if (this.userAlert) {
                    this.toastController.create({ message: 'Error when saving photo: ' + err, duration: 3000 })
                        .then((toast) => toast.present());
                }
                this.photo.emit({ url: null, error: err });
                return caught;
            })
        ).subscribe();
    }
}
