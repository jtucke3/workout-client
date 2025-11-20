import {Component,EventEmitter,Input,Output,inject,signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../loginService/login.service';

@Component({
  standalone: true,
  selector: 'app-two-fa',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './two-fa-component.html',
  styleUrls: ['./two-fa-component.scss'],
})
export class TwoFaComponent {
  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);

  @Input() challengeId!: string;
  @Input() remember = false;

  @Output() verified = new EventEmitter<void>();
  @Output() backToLoginEvent = new EventEmitter<void>();

  isLoading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const code = this.form.getRawValue().code!;

    try {
      const res = await this.loginService.verify2fa({
        challengeId: this.challengeId,
        code, // keep as string (important for leading zeros)
      });

      if (!res.token) {
        throw new Error('No token returned after 2FA verification');
      }

      this.loginService.storeToken(res.token, this.remember);
      this.verified.emit();
    } catch (err: any) {
      console.error('2FA verify error:', err);
      this.error.set('Invalid code or challenge expired.');
    } finally {
      this.isLoading.set(false);
    }
  }

  backToLogin(){
    this.backToLoginEvent.emit();
  }
}
