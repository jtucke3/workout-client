import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';
import { FriendsService } from './friendsService/friends.service';
import { FriendPreviewWebVo } from './friendsModels/friends-api.models';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, Navbar, RouterModule, FormsModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss',
})
export class Friends {
  private friendsService = inject(FriendsService);

  // Simple field bound via ngModel
  searchQuery = '';

  // Signals for UI state
  private _searchResults = signal<FriendPreviewWebVo[]>([]);
  searchResults = this._searchResults.asReadonly();

  private _myFriends = signal<FriendPreviewWebVo[]>([]);
  myFriends = this._myFriends.asReadonly();

  private _incomingRequests = signal<FriendPreviewWebVo[]>([]);
  incomingRequests = this._incomingRequests.asReadonly();

  private _isSearching = signal(false);
  isSearching = this._isSearching.asReadonly();

  private _isLoadingFriends = signal(false);
  isLoadingFriends = this._isLoadingFriends.asReadonly();

  private _error = signal<string | null>(null);
  error = this._error.asReadonly();

  private searchDebounceHandle: any;

  constructor() {
    this.loadFriendsAndIncoming();
  }

  // --- Initial load ---
  async loadFriendsAndIncoming(): Promise<void> {
    this._isLoadingFriends.set(true);
    this._error.set(null);

    try {
      const [friends, incoming] = await Promise.all([
        this.friendsService.listFriends(),
        this.friendsService.listIncomingRequests(),
      ]);
      this._myFriends.set(friends);
      this._incomingRequests.set(incoming);
    } catch (err) {
      console.error('Unable to load friends/incoming requests', err);
      this._error.set('Unable to load friends right now.');
    } finally {
      this._isLoadingFriends.set(false);
    }
  }

  // --- Search logic ---
  onSearchQueryChange(query: string): void {
    this.searchQuery = query;

    if (this.searchDebounceHandle) {
      clearTimeout(this.searchDebounceHandle);
    }

    // Only search if at least 3 characters
    if (!query || query.trim().length < 3) {
      this._searchResults.set([]);
      return;
    }

    this.searchDebounceHandle = setTimeout(() => {
      this.runSearch();
    }, 300);
  }

  async runSearch(): Promise<void> {
    const q = this.searchQuery.trim();
    if (q.length < 3) {
      this._searchResults.set([]);
      return;
    }

    this._isSearching.set(true);
    this._error.set(null);

    try {
      const results = await this.friendsService.searchUsers(q);
      this._searchResults.set(results);
    } catch (err) {
      console.error('Friend search failed', err);
      this._error.set('Unable to search users right now.');
      this._searchResults.set([]);
    } finally {
      this._isSearching.set(false);
    }
  }

  // --- Friend actions ---

  async sendRequest(user: FriendPreviewWebVo): Promise<void> {
    try {
      await this.friendsService.sendFriendRequest(user.id);
      // Re-run search + refresh friends/incoming
      await Promise.all([this.runSearch(), this.loadFriendsAndIncoming()]);
    } catch (err) {
      console.error('Unable to send friend request', err);
      this._error.set('Unable to send friend request.');
    }
  }

  // Accept is now only used for incoming requests, NOT search results
  async acceptRequest(user: FriendPreviewWebVo): Promise<void> {
    try {
      await this.friendsService.acceptFriendRequest(user.id);
      await this.loadFriendsAndIncoming();
      await this.runSearch();
    } catch (err) {
      console.error('Unable to accept friend request', err);
      this._error.set('Unable to accept friend request.');
    }
  }

  async removeFriend(friend: FriendPreviewWebVo): Promise<void> {
    if (!confirm(`Remove ${friend.displayName} from your friends?`)) {
      return;
    }

    try {
      await this.friendsService.removeFriend(friend.id);
      await this.loadFriendsAndIncoming();
      await this.runSearch();
    } catch (err) {
      console.error('Unable to remove friend', err);
      this._error.set('Unable to remove friend.');
    }
  }

  // --- Small helpers for template ---
  isAlreadyFriend(user: FriendPreviewWebVo): boolean {
    return !!user.friend;
  }

  // isPending here is interpreted as: "I have sent a request to this user"
  isPending(user: FriendPreviewWebVo): boolean {
    return !!user.pending && !user.friend;
  }
}
