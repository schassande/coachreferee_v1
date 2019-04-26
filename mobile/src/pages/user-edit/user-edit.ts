import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { LoadingController, NavController } from '@ionic/angular';
import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { ResponseWithData } from './../../app/service/response';
import { UserService } from './../../app/service/UserService';
import { User, CONSTANTES } from './../../app/model/user';

/**
 * Generated class for the UserNewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-user-edit',
  templateUrl: 'user-edit.html',
})
export class UserEditPage implements OnInit {
  user: User;
  error: string[] = [];
  constantes = CONSTANTES;

  constructor(
    private navController: NavController,
    private route: ActivatedRoute,
    public userService: UserService,
    public connectedUserService: ConnectedUserService,
    public loadingCtrl: LoadingController) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(
      map( (paramMap: ParamMap) => {
        const userId = paramMap.get('id');
        if (userId) {
          this.userService.get(userId).subscribe((res: ResponseWithData<User>) => {
            if (res.error) {
              this.loadingCtrl.create({
                message: 'Problem to load referee informaion ...',
                duration: 3000
              }).then( (loader) => loader.present())
              .then(() => {
                this.navController.navigateRoot('/home');
              });
            } else {
              this.user = res.data;
              console.log('load user: ', this.user);
              this.ensureDataSharing();
            }
          });
        } else {
          this.initReferee();
        }
          })
    ).subscribe();
  }

  private ensureDataSharing() {
    if (!this.user.dataSharingAgreement) {
      console.log('Add dataSharingAgreement field to the existing user.');
      this.user.dataSharingAgreement = {
        personnalInfoSharing: 'YES',
        photoSharing: 'YES',
        refereeAssessmentSharing: 'YES',
        refereeCoachingInfoSharing: 'YES',
        coachAssessmentSharing: 'YES',
        coachCoachingInfoSharing: 'YES',
        coachProSharing: 'NO'
      };
    }
  }

  public initReferee() {
    this.user = {
      id: null,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      firstName: '',
      lastName: '',
      shortName: '',
      country: CONSTANTES.countries[0][0],
      email: '@',
      gender: 'M',
      mobilePhones: [ ],
      photo: {
        id: null,
        url: null
      },
      speakingLanguages: [ 'EN' ],
      referee : {
          refereeLevel: null,
          refereeCategory : 'OPEN',
          nextRefereeLevel: null
      },
      refereeCoach: {
          refereeCoachLevel: null
      },
      password: '',
      token: null,
      defaultCompetition: '',
      defaultGameCatory: 'OPEN',
      dataSharingAgreement: {
        personnalInfoSharing: 'YES',
        photoSharing: 'YES',
        refereeAssessmentSharing: 'YES',
        refereeCoachingInfoSharing: 'YES',
        coachAssessmentSharing: 'YES',
        coachCoachingInfoSharing: 'YES',
        coachProSharing: 'NO'
      }
    };
  }
  isValid(): boolean {
    this.error = [];
    if (!this.isValidString(this.user.firstName, 3, 15)) {
      this.error.push(('Invalid first name: 3 to 15 chars'));
    }
    if (!this.isValidString(this.user.lastName, 3, 15)) {
      this.error.push(('Invalid last name: 3 to 15 chars'));
    }
    if (!this.isValidString(this.user.shortName, 3, 5)) {
      this.error.push(('Invalid short name: 3 to 5 chars'));
    }
    if (!this.isValidString(this.user.email, 5, 50)) {
      this.error.push(('Invalid email: 5 to 50 chars'));
    }
    return this.error.length === 0;
  }
  isValidString(str: string, minimalLength: number = 0, maximalLength: number = 100): boolean {
    return str && str.trim().length >= minimalLength && str.trim().length <= maximalLength;
  }

  updateShortName() {
    if (this.isValidString(this.user.firstName, 3)
      && this.isValidString(this.user.lastName, 3)
      && (!this.user.shortName || this.user.shortName.trim().length === 0)) {
        this.user.shortName = this.user.firstName.charAt(0).toUpperCase()
          + this.user.lastName.charAt(0).toUpperCase()
          + this.user.lastName.charAt(this.user.lastName.length - 1).toUpperCase();
    }
  }


  public newUser(event) {
    if (this.isValid()) {
      this.userService.save(this.user).subscribe((response: ResponseWithData<User>) => {
        if (response.error) {
          this.error.push('Error when saving the user info: ' + this.error);
        } else {
          this.user = response.data;
          console.log('Saved user: ', this.user);
          this.navController.navigateRoot('/home');
        }
      });
    }
  }

  getPicture() {
    /*
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      cameraDirection: this.camera.Direction.FRONT,
      allowEdit: false
    };

    this.camera.getPicture(options).then((imageUrl) => {
        console.log('getPicture: ', imageUrl);
        this.user.photo = { url : imageUrl, id : null };
      },
      (err) => {
        console.error('getPicture: ', err);
      });
      */
  }
}
