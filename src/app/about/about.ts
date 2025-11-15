import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [Navbar, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About {

}
