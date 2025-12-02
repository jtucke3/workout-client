import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  FriendActivityWebVo,
  FriendPreviewWebVo,
  FriendProfileWebVo,
} from '../friendsModels/friends-api.models';
import { AuthUserService } from '../../../shared/services/auth-user.service';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private http = inject(HttpClient);
  private authUser = inject(AuthUserService);

  private readonly BASE = '/api/friends';

  private getCurrentUserId(): string {
    // Adjust this to match your AuthUserService API if needed
    const current = (this.authUser as any)._user
      ? (this.authUser as any)._user()
      : (this.authUser as any).user?.();

    const id = current?.id;
    if (!id) {
      throw new Error('No current user id available in AuthUserService.');
    }
    return id;
  }

  // --- Search users by query ---
  searchUsers(query: string): Promise<FriendPreviewWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendPreviewWebVo[]>(`${this.BASE}/search`, {
        params: { userId, q: query },
      })
    );
  }

  // --- My accepted friends ---
  listFriends(): Promise<FriendPreviewWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendPreviewWebVo[]>(this.BASE, { params: { userId } })
    );
  }

  // --- Incoming friend requests (people who sent ME a request) ---
  listIncomingRequests(): Promise<FriendPreviewWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendPreviewWebVo[]>(`${this.BASE}/incoming`, {
        params: { userId },
      })
    );
  }

  // --- Send friend request (or auto-accept if target is public) ---
  sendFriendRequest(targetUserId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.post<void>(
        `${this.BASE}/request/${targetUserId}`,
        null,
        { params: { userId } }
      )
    );
  }

  // --- Accept an incoming friend request ---
  acceptFriendRequest(fromUserId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.post<void>(
        `${this.BASE}/accept/${fromUserId}`,
        null,
        { params: { userId } }
      )
    );
  }

  // --- Remove an existing friend ---
  removeFriend(friendId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.delete<void>(`${this.BASE}/${friendId}`, {
        params: { userId },
      })
    );
  }

  // --- Recent activity (placeholder / future dashboard) ---
  listRecentActivity(): Promise<FriendActivityWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendActivityWebVo[]>(`${this.BASE}/activity`, {
        params: { userId },
      })
    );
  }

  /**
   * Friend profile: workouts/goals with privacy handling.
   * Backend enforces:
   *  - if profilePrivate=false -> canViewDetails=true for everyone
   *  - if profilePrivate=true -> canViewDetails=true only if viewer is a friend or same user
   */
  getFriendProfile(friendId: string): Promise<FriendProfileWebVo> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendProfileWebVo>(`${this.BASE}/profile/${friendId}`, {
        params: { userId },
      })
    );
  }
}
