import { Camera, CameraOptions } from '@ionic-native/camera';
import { ResponseWithData } from './../../app/service/response';
import { UserService } from './../../app/service/UserService';
import { User } from './../../app/model/user';
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

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
export class UserEditPage {
  user: User;
  error: any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public userService: UserService,
    public camera:Camera) {
  }

  ionViewDidLoad() {
    this.user = this.navParams.get('user');
    if (!this.user) {
      const userId = this.navParams.get('userId');
      if (userId) {
        this.userService.get(userId).subscribe((res:ResponseWithData<User>) => {
          this.user = res.data;
          this.error = res.error;
        });
      } else {
        this.initReferee();
      }
    } 
  }

  public initReferee() {
    this.user = {
      id: 0,
      version: 0,
      creationDate : new Date(),
      lastUpdate : new Date(),
      dataStatus: 'NEW',
      firstName: '',
      lastName: '',
      shortName: '',
      birthday: new Date(1977, 11, 22),
      country: '',
      email: '',
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
      defaultGameCatory: 'OPEN'
    };
  
  }
  public newUser(event) {
    this.userService.save(this.user).subscribe((response: ResponseWithData<User>) => {
      this.error = response.error;
      if (this.error) {
        console.log('Error when saving new user: ' + this.error);
      } else {
        this.user = response.data;
        console.log('New user: ' + this.user);
        this.navCtrl.pop();
      }
    });
  }
  
  getPicture() {
    const options: CameraOptions = {
      quality: 50,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      cameraDirection: this.camera.Direction.FRONT,
      allowEdit: false
    }
    
    this.camera.getPicture(options).then((imageUrl) => {
        console.log('getPicture: ', imageUrl);
        this.user.photo = { url : imageUrl, id : null }
      }, 
      (err) => {
        console.error('getPicture: ', err);
      });
  }
}
