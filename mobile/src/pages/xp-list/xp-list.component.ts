import { Component, OnInit } from '@angular/core';

import { XpService } from './../../app/service/XpService';

@Component({
  selector: 'app-xp-list',
  templateUrl: './xp-list.component.html',
  styleUrls: ['./xp-list.component.scss'],
})
export class XpListComponent implements OnInit {

  constructor(private xpService: XpService) { }

  ngOnInit() {}

}
