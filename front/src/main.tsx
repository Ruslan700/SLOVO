import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import AppBootstrap from './core/bootstrap/AppBootstrap';
import GlobalStyles from './core/styles/GlobalStyles';
import RouterGate from './core/bootstrap/RouterGate';

import store from './core/store/store';

import './core/styles/abstracts/variables.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <GlobalStyles />
      <AppBootstrap />
      <RouterGate />
    </Provider>
  </StrictMode>,
);
