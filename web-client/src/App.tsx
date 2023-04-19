import './App.css'
import React from 'react'
import '@elastic/eui/dist/eui_theme_light.css';
import { EuiProvider } from '@elastic/eui';

import {Route, Switch} from 'react-router'
import {BrowserRouter} from 'react-router-dom'
import {RbacProvider} from './hooks/useRbac'
import {UsersProvider} from './hooks/useUsers'
// import Header from './components/Header'
import Footer from './components/Footer'
import Home from './views/Home'
import NewUser from './views/NewUser'
import Advanced from './deadcode/views/Advanced'
import EditUser from './views/EditUser'

import UsersList from './views/UsersList';
import CreateUser from './views/CreateUser';
import Header from './components/Header-eui';

export default function App() {
  return (
    <BrowserRouter>
      <RbacProvider>
        <UsersProvider>
          <EuiProvider colorMode="light">
            {/* <div
              style={{
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
              }}
            > */}
              {/* <div style={{ flexShrink: 0 }}> */}
                <Header />
              {/* </div> */}

              {/* <div style={{ flexGrow: 1, backgroundColor: '#edf2f7' }}> */}
                <Switch>
                  <Route path="/advanced" exact component={Advanced} />
                  <Route path="/new-user" exact component={NewUser} />
                  <Route path="/new-user-test" exact component={CreateUser} />
                  <Route path="/users/:username" exact component={EditUser} />
                  {/* <Route path="/" exact component={Home} /> */}
                  <Route path="/" exact component={UsersList} />
                </Switch>
              {/* </div> */}

              {/* <div style={{ flexShrink: 0 }}>
                <Footer />
              </div> */}
            {/* </div> */}
          </EuiProvider>
        </UsersProvider>
      </RbacProvider>
    </BrowserRouter>
  )
}
