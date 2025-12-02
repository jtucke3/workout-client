import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { FriendGoalSummaryWebVo, FriendProfileWebVo, FriendWorkoutSummaryWebVo } from '../friendsModels/friends-api.models';
import { FriendsService } from '../friendsService/friends.service';

@Component({
  selector: 'app-friend-profile',
  standalone: true,
  imports: [CommonModule, Navbar, RouterModule],
  templateUrl: './friend-profile.html',
  styleUrl: './friend-profile.scss'
})
export class FriendProfile {
  private route = inject(ActivatedRoute);
  private friendsService = inject(FriendsService);

  profile = signal<FriendProfileWebVo | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  async ngOnInit() {
    const friendId = this.route.snapshot.paramMap.get('id');
    if (!friendId) {
      this.error.set('No user specified.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = await this.friendsService.getFriendProfile(friendId);
      this.profile.set(data);
    } catch (err) {
      console.error('Failed to load friend profile', err);
      this.error.set('Unable to load profile right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  workouts(): FriendWorkoutSummaryWebVo[] {
    return this.profile()?.workouts ?? [];
  }

  goals(): FriendGoalSummaryWebVo[] {
    return this.profile()?.goals ?? [];
  }
}
