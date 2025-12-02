import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  FriendActivityWebVo,
  FriendPreviewWebVo
} from '../friendsModels/friends-api.models';
import { AuthUserService } from '../../../shared/services/auth-user.service';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private http = inject(HttpClient);
  private authUser = inject(AuthUserService);

  private readonly BASE = '/api/friends';

  /**
   * Returns the currently logged-in user's id.
   * Throws if the user is not loaded (should not happen after login).
   */
  private getCurrentUserId(): string {
    const current = this.authUser.user(); // signal -> call it
    console.log('[FriendsService] Current user when calling friends API:', current);

    if (!current) {
      throw new Error('Current user is not loaded; cannot use friends API.');
    }
    if (!current.id) {
      throw new Error(
        'Current user has no id; cannot use friends API. User object: ' +
          JSON.stringify(current)
      );
    }
    return current.id;
  }

  listFriends(): Promise<FriendPreviewWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendPreviewWebVo[]>(this.BASE, {
        params: { userId }
      })
    );
  }

  search(query: string): Promise<FriendPreviewWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendPreviewWebVo[]>(`${this.BASE}/search`, {
        params: { userId, q: query }
      })
    );
  }

  sendRequest(targetUserId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.post<void>(
        `${this.BASE}/request/${targetUserId}`,
        {},
        { params: { userId } }
      )
    );
  }

  acceptRequest(fromUserId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.post<void>(
        `${this.BASE}/accept/${fromUserId}`,
        {},
        { params: { userId } }
      )
    );
  }

  removeFriend(friendId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.delete<void>(
        `${this.BASE}/${friendId}`,
        { params: { userId } }
      )
    );
  }

  getRecentActivity(): Promise<FriendActivityWebVo[]> {
    const userId = this.getCurrentUserId();
    return firstValueFrom(
      this.http.get<FriendActivityWebVo[]>(
        `${this.BASE}/activity`,
        { params: { userId } }
      )
    );
  }
}
