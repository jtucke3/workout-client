// friendsModels/friends-api.models.ts

// Matches com.jtucke3.workoutapi.webVo.friends.FriendPreviewWebVo
export interface FriendPreviewWebVo {
  id: string;
  displayName: string;
  friend: boolean;
  pending: boolean;
}

// Matches com.jtucke3.workoutapi.webVo.friends.FriendActivityWebVo
// (We’ll use this later for dashboard activity)
export interface FriendActivityWebVo {
  friendId: string;
  friendName: string;
  workoutName: string;
  occurredAt: string; // ISO timestamp from backend
}
