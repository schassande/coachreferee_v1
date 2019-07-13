import { Injectable } from '@angular/core';
import { HelpWidgetComponent } from './../../pages/widget/help-widget-component';
import { BookmarkService } from './BookmarkService';
import { ModalController } from '@ionic/angular';

@Injectable()
export class HelpService {

    constructor(
        private modalController: ModalController,
        private bookmarkService: BookmarkService) {
    }

    public addHelp(topic: string) {
        this.bookmarkService.addBookmarkEntry({
            id: topic + 'Help',
            label : 'Help',
            iconName: 'help',
            handler: () => {
                this.modalController.create({
                    component: HelpWidgetComponent,
                    componentProps : { topic}}
                    ).then((mod) => mod.present());
            }
        });
    }
}
