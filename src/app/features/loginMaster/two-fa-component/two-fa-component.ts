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

type TwoFaMode = 'verify' | 'setup';
type SetupStep = 'recommend' | 'configure';

@Component({
  standalone: true,
  selector: 'app-two-fa-component',
  imports: [CommonModule, ReactiveFormsModule],
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

  // Shared bits
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Verify-mode form
  verifyForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  // Setup-mode internal state
  setupStep = signal<SetupStep>('recommend');

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
        this.loginService.storeToken(response.token, /*remember*/ true);
      }

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
  startSetup() {
    if (this.mode !== 'setup') return;
    this.setupStep.set('configure');
  }

  /** Called when user clicks "Remind me later". */
  skipSetup() {
    this.cancelled.emit();
  }

  /**
   * Placeholder "finish setup" — once you add backend endpoints for 2FA setup,
   * this is where you’d call them. For now, we just treat it as completed.
   */
  completeSetup() {
    this.completed.emit();
  }

  backToRecommend() {
    if (this.mode !== 'setup') return;
    this.setupStep.set('recommend');
  }
}
