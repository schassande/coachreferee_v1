import { ConnectedUserService } from './../../app/service/ConnectedUserService';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { ResponseWithData } from './../../app/service/response';
import { RefereeService } from './../../app/service/RefereeService';
import { Referee, CONSTANTES } from './../../app/model/user';
import { Component } from '@angular/core';
import { IonicPage, NavParams, LoadingController } from 'ionic-angular';
import { NavController } from 'ionic-angular';

/**
 * Generated class for the RefereeNewPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-referee-edit',
  templateUrl: 'referee-edit.html',
})
export class RefereeEditPage {
  referee: Referee;
  error: any;
  constantes=CONSTANTES;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public refereeService: RefereeService,
    public connectedUserService: ConnectedUserService,
    public loadingCtrl: LoadingController,
    private camera: Camera) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RefereeNewPage');
    const referee:Referee = this.navParams.get('referee');
    if (referee) {
      this.setReferee(referee);
    } else {
      const id = this.navParams.get('id');
      if (id) {
        this.setRefereeId(id);
      } else {
        this.referee = {
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
          }
        };
      }
    }
  }

  private setRefereeId(id: number) {
    console.log("RefereeView.setRefereeId(" + id + ")");
    this.refereeService.get(id).subscribe((response: ResponseWithData<Referee>) => {
      if (response.error) {
        const loader = this.loadingCtrl.create({
          content: "Problem to load referee informaion ...",
          duration: 3000
        });
        loader.present().then(() => {
          this.connectedUserService.navBackOrRoot(this.navCtrl);
        });
      } else {
        this.setReferee(response.data);
      }
    });
  }

  private setReferee(referee: Referee) {
    console.log("RefereeView.setReferee(" + referee + ")");
    this.referee = referee;
  }

  public newReferee(event) {
    this.refereeService.save(this.referee).subscribe((response: ResponseWithData<Referee>) => {
      this.error = response.error;
      if (this.error) {
        console.log('Error when saving new user: ' + this.error);
      } else {
        this.referee = response.data;
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
      cameraDirection: this.camera.Direction.BACK,
      allowEdit: false
    }
    
    this.camera.getPicture(options).then((imageUrl) => {
        console.log('getPicture: ', imageUrl);
        this.referee.photo = { url : imageUrl, id : null }
      }, 
      (err) => {
        console.error('getPicture: ', err);
      });
  }
}
