import { Component } from '@angular/core';
import { Navbar } from '../../shared/components/navbar/navbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-friends',
  imports: [Navbar, RouterModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss'
})
export class Friends {

}
