import React, { useState, useEffect } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/leaderboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getProgressToNextLevel = (xp, level) => {
    if (level === 'Master') return 100;
    const targetXp = level === 'Novice' ? 500 : 1500;
    return Math.min(100, Math.round((xp / targetXp) * 100));
  };

  if (loading) {
    return <div className="card mb-8 text-center py-4">Loading leaderboard...</div>;
  }

  return (
    <div className="card mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900">Leaderboard - Top Learners</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">XP</th>
              <th className="px-4 py-2 text-left">Courses</th>
              <th className="px-4 py-2 text-left">Level</th>
              <th className="px-4 py-2 text-left">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaderboard.map((entry) => {
              const isCurrentUser = user?.username === entry.username;
              return (
                <tr
                  key={entry.rank}
                  className={`transition-colors ${
                    isCurrentUser
                      ? 'bg-blue-100 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Rank Column: Number + Medal for top 3 */}
                  <td className="px-4 py-2 font-medium">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-700">{entry.rank}</span>
                      {getRankDisplay(entry.rank)}
                    </div>
                  </td>

                  {/* User Column */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{entry.username}</span>
                      {isCurrentUser && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </td>

                  {/* XP Column */}
                  <td className="px-4 py-2 font-semibold text-yellow-600">{entry.xp} XP</td>

                  {/* Courses Completed */}
                  <td className="px-4 py-2 text-gray-600">{entry.completedCourses}</td>

                  {/* Level Badge */}
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        entry.level === 'Master'
                          ? 'bg-purple-100 text-purple-700'
                          : entry.level === 'Explorer'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {entry.level}
                    </span>
                  </td>

                  {/* Progress to next level */}
                  <td className="px-4 py-2 w-32">
                    {entry.level !== 'Master' && (
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{
                              width: `${getProgressToNextLevel(entry.xp, entry.level)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {entry.xp} / {entry.level === 'Novice' ? 500 : 1500} XP
                        </p>
                      </div>
                    )}
                    {entry.level === 'Master' && (
                      <span className="text-xs text-purple-500">🏆 Master</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {userRank && (
        <div className="mt-4 pt-3 border-t text-sm text-gray-600 flex justify-between items-center">
          <span>
            Your rank: <strong>#{userRank}</strong>
          </span>
          <span className="text-xs">Keep learning to climb the leaderboard! 🚀</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;