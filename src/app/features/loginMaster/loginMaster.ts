import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Login } from './loginComponent/login';

@Component({
  standalone: true,
  selector: 'app-login-master',
  imports: [CommonModule, Login],
  templateUrl: './loginMaster.html',
  styleUrls: ['./loginMaster.scss']
})
export class LoginMaster {
  // Later this can coordinate multi-step flows:
  // - Step 1: credentials
  // - Step 2: 2FA code
  // For now it just renders the Login component.
}
