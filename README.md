This is a React application that displays POIs (Points of Interest) on a Google Map using the Boat Navigation API.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in the root directory with your Google Maps API credentials:
```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_API_BASE_URL=https://test.argonav.io/api/v1
```

3. Start the development server:
```bash
yarn dev
```

## Architecture

- **State Management**: Redux Toolkit for global state management
- **Type Safety**: TypeScript for type checking and better developer experience
- **Component Structure**: 
  - Container/Presentational pattern
  - Memoized components for performance optimization
- **API Integration**:
  - Environment-based configuration
  - Debounced requests
  - Response caching
- **Performance Optimizations**:
  - Memoized selectors
  - Debounced API calls
  - Conditional re-renders
  - Zoom threshold for updates

## API

The application uses the Argo Navigation API endpoint:
`https://test.argonav.io/api/v1/optimized_lists/pois/upsert`

## Technologies Used

- React
- TypeScript
- Vite
- Redux Toolkit
- visgl/react-google-maps
- lodash (with @types/lodash)
