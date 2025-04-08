import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { downloadCSV } from './utils/csv';

const App = () => {
  const [admission, setAdmission] = useState('');
  const [name, setName] = useState('');
  const [userExists, setUserExists] = useState(null);
  const [work, setWork] = useState('');
  const [stars, setStars] = useState('');
  const [userData, setUserData] = useState(null);
  const [userLogsSelf, setUserLogsSelf] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [admin, setAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [userLogs, setUserLogs] = useState({});
  const [expandedUsers, setExpandedUsers] = useState({});

  const ADMIN_SECRET = 'supersecure123';


  useEffect(() => {
    const fetchLeaderboard = async () => {
      const q = query(collection(db, 'users'), orderBy('totalStars', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaderboard(data);
    };
    fetchLeaderboard();
  }, [userData]);

  const fetchSelfLogs = async (userId) => {
    const logsSnap = await getDocs(collection(db, 'users', userId, 'logs'));
    const logs = logsSnap.docs.map(doc => doc.data());
    setUserLogsSelf(logs);
  };

  const handleSearch = async () => {
    const docRef = doc(db, 'users', admission);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserExists(true);
      setName(docSnap.data().name);
      setUserData({ id: docSnap.id, ...docSnap.data() });
      fetchSelfLogs(admission);
    } else {
      setUserExists(false);
    }
  };

  const handleRegister = async () => {
    if (!name) return;
    await setDoc(doc(db, 'users', admission), {
      name,
      totalStars: 0
    });
    setUserExists(true);
    setUserData({ id: admission, name, totalStars: 0 });
    fetchSelfLogs(admission);
  };

  const handleLog = async () => {
    if (!work || !stars) return;
    const userRef = doc(db, 'users', admission);
    const newTotal = (userData.totalStars || 0) + parseInt(stars);
    await setDoc(userRef, {
      name,
      totalStars: newTotal
    });

    await addDoc(collection(userRef, 'logs'), {
      work,
      stars: parseInt(stars),
      timestamp: new Date()
    });

    setUserData(prev => ({ ...prev, totalStars: newTotal }));
    setWork('');
    setStars('');
    fetchSelfLogs(admission);
  };

  

const handleAdminLogin = async () => {
  if (adminPassword === ADMIN_SECRET) {
    setAdmin(true);
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllUsers(users);
  } else {
    alert('Wrong password');
  }
};


  const toggleLogs = async (userId) => {
    setExpandedUsers(prev => ({ ...prev, [userId]: !prev[userId] }));
    if (!userLogs[userId]) {
      const logsSnap = await getDocs(collection(db, 'users', userId, 'logs'));
      const logs = logsSnap.docs.map(doc => doc.data());
      setUserLogs(prev => ({ ...prev, [userId]: logs }));
    }
  };

  const deleteUserWithLogs = async (userId) => {
    const logsSnap = await getDocs(collection(db, 'users', userId, 'logs'));
    const deletePromises = logsSnap.docs.map(docSnap =>
      deleteDoc(doc(db, 'users', userId, 'logs', docSnap.id))
    );
    await Promise.all(deletePromises);
    await deleteDoc(doc(db, 'users', userId));
    setAllUsers(prev => prev.filter(user => user.id !== userId));
    alert(`User ${userId} deleted`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <h1 className="text-4xl mb-6 text-left font-bold text-green-400">🌟 Star Logger</h1>

      {!admin && (
        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            value={admission}
            onChange={e => setAdmission(e.target.value)}
            placeholder="Enter Admission Number"
            className="p-2 rounded bg-gray-800 text-white border border-gray-600 w-64"
          />
          <button onClick={handleSearch} className="bg-blue-600 px-4 py-2 rounded">
            🔍 Search
          </button>
        </div>
      )}

      {userExists === false && (
        <div className="mb-6">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter Name"
            className="p-2 rounded bg-gray-800 text-white border border-gray-600 mb-2"
          />
          <br />
          <button onClick={handleRegister} className="bg-green-600 px-4 py-2 rounded">
            Register
          </button>
        </div>
      )}

      {userExists && userData && (
        <div className="mb-10">
          <h2 className="text-xl mb-2">Hello, {userData.name} 👋</h2>
          <p className="mb-4">Total Stars: ⭐ {userData.totalStars}</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={work}
              onChange={e => setWork(e.target.value)}
              placeholder="Work done"
              className="p-2 rounded bg-gray-800 text-white border border-gray-600 w-64"
            />
            <input
              type="number"
              value={stars}
              onChange={e => setStars(e.target.value)}
              placeholder="Stars"
              className="p-2 rounded bg-gray-800 text-white border border-gray-600 w-24"
            />
            <button onClick={handleLog} className="bg-green-700 px-4 py-2 rounded">
              ➕ Add Stars
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg mb-2">📘 Your Log History</h3>
            {userLogsSelf.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-300">
                {userLogsSelf.map((log, i) => (
                  <li key={i}>
                    {log.work} — ⭐ {log.stars} — {new Date(log.timestamp.seconds * 1000).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No logs yet. Start adding stars!</p>
            )}
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-2xl mb-4">🏆 Leaderboard (Top 10)</h2>
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="text-green-300">
              <th className="p-2">Name</th>
              <th className="p-2">Admission No.</th>
              <th className="p-2">Stars ⭐</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((u, i) => (
              <tr key={u.id} className="border-t border-gray-700">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.totalStars}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!admin && (
        <div className="fixed top-4 right-4">
          <input
            type="password"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="Admin password"
            className="p-2 rounded bg-gray-800 text-white border border-gray-600 mr-2"
          />
          <button onClick={handleAdminLogin} className="bg-red-700 px-3 py-2 rounded">
            🔒 Admin
          </button>
        </div>
      )}

      {admin && (
        <div>
          <h2 className="text-2xl mb-4 text-blue-400">🛠️ Admin Panel</h2>
          {allUsers.map(user => (
            <div key={user.id} className="mb-4 border-b border-gray-700 pb-2">
              <div className="flex justify-between items-center">
                <p>
                  <strong>{user.name}</strong> ({user.id}) — ⭐ {user.totalStars}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleLogs(user.id)}
                    className="bg-gray-700 px-2 py-1 rounded text-sm"
                  >
                    {expandedUsers[user.id] ? '🔼 Hide Logs' : '🔽 View Logs'}
                  </button>
                  <button
                    onClick={() => deleteUserWithLogs(user.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              {expandedUsers[user.id] && (
                <div className="mt-2 ml-4">
                  {userLogs[user.id] ? (
                    <div>
                      <ul className="list-disc pl-4 text-sm">
                        {userLogs[user.id].map((log, i) => (
                          <li key={i}>
                            {log.work} — ⭐ {log.stars} — {new Date(log.timestamp.seconds * 1000).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        onClick={() => downloadCSV(userLogs[user.id], `${user.name}-logs.csv`)}
                      >
                        ⬇️ Download Logs as CSV
                      </button>
                    </div>
                  ) : (
                    <p>Loading logs...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <footer className="text-center text-gray-500 text-sm mt-8">
        Made by <a href="Prithvi.R.Patil" className="underline">Prithvi</a>
      </footer>
    </div>
  );
};

export default App;
