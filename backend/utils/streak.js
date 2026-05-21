export const updateStreak = (user) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastActive) {
    // First activity ever
    user.streak = 1;
    user.lastActive = today;
    return user;
  }

  const lastActiveDate = new Date(user.lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);

  const diffDays = (today - lastActiveDate) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) {
    // Already active today, no change
    return user;
  } else if (diffDays === 1) {
    // Consecutive day
    user.streak += 1;
    user.lastActive = today;
  } else {
    // Missed one or more days, reset streak
    user.streak = 1;
    user.lastActive = today;
  }
  return user;
};