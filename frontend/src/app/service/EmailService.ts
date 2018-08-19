import { EmailComposer } from '@ionic-native/email-composer';
import { Injectable } from '@angular/core';


@Injectable()
export class EmailService {
    
    constructor(private emailComposer: EmailComposer) {
    }

    public sendEmail(email) {
/*
      this.emailComposer.requestPermission()
          .then((permit) => console.log('Permit:', permit))
          .catch((err) => console.error('Request Permission error:', err));

      this.emailComposer.isAvailable().then((available: boolean) =>{
          if(available) {
            console.log('Email composer is available.')
          } else {
            console.error('Email composer is NOT available.')
          }
        }).catch((err) => {
          console.error(err);
        });         
*/      
      this.emailComposer.open(email).then(() => 
        console.log('Email sent:' + JSON.stringify(email, null, 2)));
   }
}