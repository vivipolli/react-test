import { Provider } from 'react-redux';
import { store } from './store';
import Map from './components/Map';
import './App.css'

function App() {
  return (
    <Provider store={store}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Map />
      </div>
    </Provider>
  );
}

export default App;
