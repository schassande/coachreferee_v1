import { ActivatedRoute, ParamMap } from '@angular/router';
import { ModalController, LoadingController } from '@ionic/angular';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
// import { Camera, CameraOptions } from '@ionic-native/camera';
import { ResponseWithData } from './../../app/service/response';
import { RefereeService } from './../../app/service/RefereeService';
import { Referee, CONSTANTES } from './../../app/model/user';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';

/**
 * Generated class for the RefereeNewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@Component({
  selector: 'page-referee-edit',
  templateUrl: 'referee-edit.html',
})
export class RefereeEditPage implements OnInit {
  referee: Referee;
  error: string[];
  constantes = CONSTANTES;

  constructor(public modalController: ModalController,
    private route: ActivatedRoute,
    public refereeService: RefereeService,
    public connectedUserService: ConnectedUserService,
    public loadingCtrl: LoadingController
    // private camera: Camera
    ) {
  }

  ngOnInit() {
    if (this.referee) {
      this.setReferee(this.referee);
    } else {
      this.route.paramMap.pipe(
        map((params: ParamMap) => {
          const id = params.get('id');
          if (id) {
            console.log('RefereeEditPage edit existing referee: ', id);
            this.setRefereeId(parseInt(id, 10));
          } else {
            console.log('RefereeEditPage new referee: ');
            this.setReferee(this.buildNewReferee());
          }
        })
      ).subscribe();
    }
  }

  private buildNewReferee(): Referee {
    return {
      id: 0,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      firstName: '',
      lastName: '',
      shortName: '',
      country: '',
      email: '',
      gender: 'M',
      mobilePhones: [ ],
      photo: {id: null, url: null},
      speakingLanguages: [ 'EN' ],
      referee : {
          refereeLevel: 'EURO_1',
          refereeCategory : 'OPEN',
          nextRefereeLevel: null,
      },
      refereeCoach: {
          refereeCoachLevel: 'NONE'
      },
      dataSharingAgreement: {
        personnalInfoSharing: 'YES',
        photoSharing: 'YES',
        refereeAssessmentSharing: 'YES',
        refereeCoachingInfoSharing: 'YES'
      }
    };
  }

  isValid(): boolean {
    this.error = [];
    if (!this.isValidString(this.referee.firstName, 3, 15)) {
      this.error.push(('Invalid first name: 3 to 15 chars'));
    }
    if (!this.isValidString(this.referee.lastName, 3, 15)) {
      this.error.push(('Invalid last name: 3 to 15 chars'));
    }
    if (!this.isValidString(this.referee.shortName, 3, 5)) {
      this.error.push(('Invalid short name: 3 to 5 chars'));
    }
    return this.error.length === 0;
  }
  isValidString(str: string, minimalLength: number = 0, maximalLength: number = 100): boolean {
    return str && str.trim().length >= minimalLength && str.trim().length <= maximalLength;
  }

  updateShortName() {
    if (this.isValidString(this.referee.firstName, 3)
      && this.isValidString(this.referee.lastName, 3)
      && (!this.referee.shortName || this.referee.shortName.trim().length === 0)) {
        this.referee.shortName = this.referee.firstName.charAt(0).toUpperCase()
          + this.referee.lastName.charAt(0).toUpperCase()
          + this.referee.lastName.charAt(this.referee.lastName.length - 1).toUpperCase();
    }
  }
  private setRefereeId(id: number) {
    console.log('RefereeEdit.setRefereeId(' + id + ')');
    this.refereeService.get(id).subscribe((response: ResponseWithData<Referee>) => {
      if (response.error) {
        this.loadingCtrl.create({
          message: 'Problem to load referee informaion ...',
          duration: 3000
        }).then((loader) => loader.present())
        .then(() => {
          this.modalController.dismiss();
        });
      } else {
        this.setReferee(response.data);
      }
    });
  }

  private setReferee(ref: Referee) {
    this.referee = this.ensureDataSharing(ref);
  }

  private ensureDataSharing(ref: Referee): Referee {
    if (!ref.dataSharingAgreement) {
      console.log('Add dataSharingAgreement field to the existing referee.');
      ref.dataSharingAgreement = {
        personnalInfoSharing: 'YES',
        photoSharing: 'YES',
        refereeAssessmentSharing: 'YES',
        refereeCoachingInfoSharing: 'YES'
      };
    }
    return ref;
  }

  public save(event) {
    if (this.isValid()) {
        this.refereeService.save(this.referee).subscribe((response: ResponseWithData<Referee>) => {
        if (response.error) {
          this.error.push('Error when saving new user: ' + this.error);
        } else {
          this.referee = response.data;
          this.refereeService.lastSelectedReferee.referee = this.referee;
          this.modalController.dismiss({ referee: this.referee});
        }
      });
    }
  }

  public cancel() {
    this.refereeService.lastSelectedReferee.referee = null;
    this.modalController.dismiss();
}

  getPicture() {
    /*
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      cameraDirection: this.camera.Direction.BACK,
      allowEdit: false
    };

    this.camera.getPicture(options).then((imageUrl) => {
        console.log('getPicture: ', imageUrl);
        this.referee.photo = { url : imageUrl, id : null };
      },
      (err) => {
        console.error('getPicture: ', err);
      });
    */
  }
}