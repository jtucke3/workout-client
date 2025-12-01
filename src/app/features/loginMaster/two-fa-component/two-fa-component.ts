import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LoginService } from '../loginService/login.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthUserService } from '../../../shared/services/auth-user.service';

type TwoFaMode = 'verify' | 'setup';
type SetupStep = 'recommend' | 'configure';

@Component({
  standalone: true,
  selector: 'app-two-fa-component',
  imports: [CommonModule, ReactiveFormsModule, QRCodeComponent],
  templateUrl: './two-fa-component.html',
  styleUrls: ['./two-fa-component.scss']
})
export class TwoFaComponent {
  @Input() mode: TwoFaMode = 'verify';

  /** Only needed in verify mode, passed from loginMaster. */
  @Input() challengeId: string | null = null;

  /** Fired when verification succeeds OR setup completes. */
  @Output() completed = new EventEmitter<void>();

  /** Fired when user cancels / goes back / chooses "remind me later". */
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private loginService = inject(LoginService);
  private authUser = inject(AuthUserService);

  // Shared bits
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Verify-mode form
  verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  // Setup-mode internal state
  setupStep = signal<SetupStep>('recommend');

  // Setup-mode data coming back from backend
  setupQrUri = signal<string | null>(null);
  setupSecret = signal<string | null>(null);

  // Guard rail form inside "configure" step:
  // - user must enter a 6-digit code from their app
  // - user must check the confirmation checkbox
  confirmForm = this.fb.group({
    confirmCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    acknowledge: [false, [Validators.requiredTrue]]
  });

  // --- VERIFY FLOW ---

  async submitVerification() {
    if (this.mode !== 'verify') return;

    if (this.verifyForm.invalid || !this.challengeId) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const code = this.verifyForm.get('code')?.value ?? '';

    try {
      const response = await this.loginService.verifyTwoFactor({
        challengeId: this.challengeId,
        code
      });

      // Store token like a normal login and finish
      if (response.token) {
        // In your existing app you likely have a "remember me" flag stored elsewhere;
        // using session as default here
        this.loginService.storeToken(response.token, true);
      }

      // Make sure current user info is set after verify
      this.authUser.setUserFromAuthPayload(response);

      this.completed.emit();
    } catch (err: any) {
      console.error('2FA verify error', err);
      this.error.set(
        err?.message || 'Verification failed. Please check your code and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- SETUP FLOW ---

  /** Called when user clicks "Set up 2FA now" on the recommendation view. */
  async startSetup() {
    if (this.mode !== 'setup') return;

    const currentUser = this.authUser.user();
    const email = currentUser?.email;

    if (!email) {
      this.error.set(
        'You need to be logged in to set up two-factor authentication.'
      );
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const res = await this.loginService.beginTwoFactorSetup(email);
      this.setupQrUri.set(res.otpauthUri);
      this.setupSecret.set(this.extractSecret(res.otpauthUri));
      this.setupStep.set('configure');
      this.confirmForm.reset({
        confirmCode: '',
        acknowledge: false
      });
    } catch (err: any) {
      console.error('2FA setup error', err);
      this.error.set(
        err?.message || 'Could not start 2FA setup. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Called when user clicks "Remind me later". */
  skipSetup() {
    this.cancelled.emit();
  }

  /**
   * User confirms they have scanned the QR and set up their authenticator app.
   * Guard rail: they must enter a 6-digit code and tick the checkbox first.
   */
  completeSetup() {
    if (this.mode !== 'setup') return;

    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }

    // We don't need the code value on the frontend for now; we just
    // require the user to have opened their app and read a code.
    this.completed.emit();
  }

  backToRecommend() {
    if (this.mode !== 'setup') return;
    this.setupStep.set('recommend');
  }

  /** Utility: extract ?secret=XYZ from an otpauth:// URI for manual entry. */
  private extractSecret(uri: string): string | null {
    if (!uri) return null;
    const match = uri.match(/secret=([^&]+)/i);
    return match ? match[1] : null;
  }
}
