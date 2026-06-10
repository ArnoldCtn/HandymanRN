import api from './api';

export const getFavorites = () => api.get('/favorites/');
export const addFavorite = (handymanId) => api.post('/favorites/', { handyman_id: handymanId });
export const removeFavorite = (handymanId) => api.delete(`/favorites/${handymanId}/`);
