/* ── API Service ──
   Connects to the Node.js Express backend REST API
*/

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include', // Crucial for sending/receiving HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch (e) {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

/* Auth */
export const authAPI = {
  login:    (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) =>           request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout:   () =>               request('/auth/logout', { method: 'POST' }),
};

/* Channels */
export const channelAPI = {
  list:   ()       => request('/channels'),
  create: (data)   => request('/channels', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id)     => request(`/channels/${id}`, { method: 'DELETE' }),
  join:   (id)     => request(`/channels/${id}/join`, { method: 'POST' }),
  requestJoin: (id) => request(`/channels/${id}/request`, { method: 'POST' }),
  listPending: (id) => request(`/channels/${id}/requests`),
  approveJoin: (id, userId) => request(`/channels/${id}/approve`, { method: 'POST', body: JSON.stringify({ userId }) }),
  rejectJoin:  (id, userId) => request(`/channels/${id}/reject`, { method: 'POST', body: JSON.stringify({ userId }) }),
  get:    (id)     => request(`/channels/${id}`),
};

/* Messages */
export const messageAPI = {
  fetch:       (channelId) => request(`/messages/${channelId}`),
  send:        (data)      => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  edit:        (id, data)  => request(`/messages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:      (id)        => request(`/messages/${id}`, { method: 'DELETE' }),
  addReaction: (id, emoji) => request(`/messages/${id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  fetchThread: (id)        => request(`/messages/${id}/thread`),
  replyThread: (id, text)  => request(`/messages/${id}/thread`, { method: 'POST', body: JSON.stringify({ text }) }),
  toggleStar:   (id)        => request(`/messages/${id}/star`, { method: 'POST' }),
  fetchStarred: ()          => request('/messages/stars'),
  markSeen:     (id)        => request(`/messages/${id}/seen`, { method: 'POST' }),
  markBulkSeen: (channelId) => request('/messages/mark-seen', { method: 'POST', body: JSON.stringify({ channelId }) }),
  togglePin:    (id)        => request(`/messages/${id}/pin`, { method: 'PUT' }),
};

/* Users */
export const userAPI = {
  list:          ()     => request('/users'),
  getProfile:    ()     => request('/users/profile'),
  updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
};
