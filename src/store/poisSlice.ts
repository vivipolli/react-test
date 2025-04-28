import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {POIResponse, POIState, POIBounds } from '../types/poi';

const initialState: POIState = {
  pois: {
    status: '',
    data: {
      items: []
    }
  },
  status: 'idle',
  error: null,
  cache: {}
};

const getFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
};

const generateCacheKey = (bounds: POIBounds) => {
  return `${bounds.swLat},${bounds.swLng},${bounds.neLat},${bounds.neLng}`;
};

export const fetchPOIs = createAsyncThunk(
  'pois/fetchPOIs',
  async (bounds: POIBounds, { getState }) => {
    const state = getState() as { pois: POIState };
    const cacheKey = generateCacheKey(bounds);
    const cachedData = state.pois.cache[cacheKey];

    // If we have cached data and it's less than 1 hour old, use it
    if (cachedData && (Date.now() - new Date(cachedData.lastUpdated).getTime() < 3600000)) {
      return {
        status: 'ok',
        data: {
          items: cachedData.pois
        }
      };
    }

    const params = new URLSearchParams({
      sw_latitude: bounds.swLat.toFixed(6),
      sw_longitude: bounds.swLng.toFixed(6),
      ne_latitude: bounds.neLat.toFixed(6),
      ne_longitude: bounds.neLng.toFixed(6),
      from_date: getFromDate()
    });


    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/optimized_lists/pois/upsert?${params}`);
    const data = await response.json();
    return data as POIResponse;
  }
);

const poisSlice = createSlice({
  name: 'pois',
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPOIs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPOIs.fulfilled, (state, action) => {
        const newItems = action.payload.data.items;
        const currentItems = state.pois.data.items;
        
        // Check if the new data is different from current data
        const hasChanges = newItems.length !== currentItems.length || 
          newItems.some((newPoi, index) => {
            const currentPoi = currentItems[index];
            return !currentPoi || 
              newPoi.id !== currentPoi.id ||
              newPoi.latitude !== currentPoi.latitude ||
              newPoi.longitude !== currentPoi.longitude;
          });

        if (hasChanges) {
          state.status = 'succeeded';
          state.pois = action.payload;

          // Update cache only if data changed
          const bounds = action.meta.arg;
          const cacheKey = generateCacheKey(bounds);
          state.cache[cacheKey] = {
            pois: action.payload.data.items,
            lastUpdated: new Date().toISOString(),
            bounds
          };
        } else {
          state.status = 'succeeded';
        }
      })
      .addCase(fetchPOIs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch POIs';
        state.pois = {
          status: '',
          data: {
            items: []
          }
        };
      });
  },
});

export const { clearCache } = poisSlice.actions;
export default poisSlice.reducer; 