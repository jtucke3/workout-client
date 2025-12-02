// Matches com.jtucke3.workoutapi.webVo.friends.FriendActivityWebVo
// (We’ll use this later for dashboard activity)
export interface FriendActivityWebVo {
  friendId: string;
  friendName: string;
  workoutName: string;
  occurredAt: string; // ISO timestamp from backend
}

// friendsModels/friends-api.models.ts

// Basic friend/user preview (search + lists)
export interface FriendPreviewWebVo {
  id: string;
  displayName: string;
  friend: boolean;
  pending: boolean;
}

// Simple workout summary for friend profiles
export interface FriendWorkoutSummaryWebVo {
  id: string;
  name: string;
  performedAt: string; // ISO timestamp
}

// Simple goal summary for friend profiles
export interface FriendGoalSummaryWebVo {
  id: string;
  title: string;
  targetDate: string | null; // ISO date or null
  progressPercent: number | null;
}

// Friend profile payload from backend for /friends/profile/{friendId}
export interface FriendProfileWebVo {
  id: string;
  displayName: string;

  // privacy flags
  profilePrivate: boolean;
  isFriend: boolean;
  canViewDetails: boolean;

  // if canViewDetails === false and profilePrivate === true,
  // frontend should show "This account is private".
  workouts: FriendWorkoutSummaryWebVo[];
  goals: FriendGoalSummaryWebVo[];
}
