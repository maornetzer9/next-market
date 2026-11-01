import React from 'react'
import App from './App.jsx'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './reducers/store.js'
import './css/b25-tokens.css'
import './index.css'
import { LoadingCoordinator } from './UI/LoadingCoordinator.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <LoadingCoordinator>
                    <App />
                </LoadingCoordinator>
            </BrowserRouter>
        </Provider>
  </React.StrictMode>,
)
