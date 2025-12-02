import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import {
  FriendGoalSummaryWebVo,
  FriendProfileWebVo,
  FriendWorkoutSummaryWebVo,
} from '../friendsModels/friends-api.models';
import { FriendsService } from '../friendsService/friends.service';

@Component({
  selector: 'app-friend-profile',
  standalone: true,
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './friend-profile.html',
  styleUrl: './friend-profile.scss',
})
export class FriendProfile {
  private route = inject(ActivatedRoute);
  private friendsService = inject(FriendsService);

  private _profile = signal<FriendProfileWebVo | null>(null);
  profile = this._profile.asReadonly();

  private _isLoading = signal(false);
  isLoading = this._isLoading.asReadonly();

  private _error = signal<string | null>(null);
  error = this._error.asReadonly();

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const friendId = params.get('friendId');
      if (friendId) {
        this.loadProfile(friendId);
      }
    });
  }

  async loadProfile(friendId: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const profile = await this.friendsService.getFriendProfile(friendId);
      this._profile.set(profile);
    } catch (err) {
      console.error('Unable to load friend profile', err);
      this._error.set('Unable to load profile right now.');
    } finally {
      this._isLoading.set(false);
    }
  }

  workouts(): FriendWorkoutSummaryWebVo[] {
    return this.profile()?.workouts ?? [];
  }

  goals(): FriendGoalSummaryWebVo[] {
    return this.profile()?.goals ?? [];
  }
}
