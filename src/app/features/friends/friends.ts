import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';
import { FriendsService } from './friendsService/friends.service';
import { FriendPreviewWebVo } from './friendsModels/friends-api.models';

@Component({
  selector: 'app-friends',
  imports: [CommonModule, Navbar, RouterModule, FormsModule],
  templateUrl: './friends.html',
  styleUrl: './friends.scss'
})
export class Friends {
  private friendsService = inject(FriendsService);

  searchQuery = '';
  // signals for reactive state
  isSearching = signal(false);
  isLoadingFriends = signal(false);
  searchResults = signal<FriendPreviewWebVo[]>([]);
  myFriends = signal<FriendPreviewWebVo[]>([]);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.loadFriends();
  }

  async loadFriends() {
    this.isLoadingFriends.set(true);
    this.error.set(null);

    try {
      const friends = await this.friendsService.listFriends();
      this.myFriends.set(friends);
    } catch (err) {
      console.error('Failed to load friends', err);
      this.error.set('Unable to load friends right now.');
    } finally {
      this.isLoadingFriends.set(false);
    }
  }

  async runSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.error.set(null);

    try {
      const results = await this.friendsService.search(q);
      this.searchResults.set(results);
    } catch (err) {
      console.error('Search failed', err);
      this.error.set('Search failed. Please try again.');
    } finally {
      this.isSearching.set(false);
    }
  }

  async sendRequest(user: FriendPreviewWebVo) {
    try {
      await this.friendsService.sendRequest(user.id);
      await this.runSearch();
      await this.loadFriends();
    } catch (err) {
      console.error('Unable to send friend request', err);
      this.error.set('Unable to send friend request.');
    }
  }

  async acceptRequest(user: FriendPreviewWebVo) {
    try {
      await this.friendsService.acceptRequest(user.id);
      await this.runSearch();
      await this.loadFriends();
    } catch (err) {
      console.error('Unable to accept friend request', err);
      this.error.set('Unable to accept friend request.');
    }
  }

  async removeFriend(user: FriendPreviewWebVo) {
    try {
      await this.friendsService.removeFriend(user.id);
      await this.loadFriends();
    } catch (err) {
      console.error('Unable to remove friend', err);
      this.error.set('Unable to remove friend.');
    }
  }

  // helpers for template
  isAlreadyFriend(user: FriendPreviewWebVo): boolean {
    return !!user.friend;
  }

  isPending(user: FriendPreviewWebVo): boolean {
    return !!user.pending && !user.friend;
  }
}
