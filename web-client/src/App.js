import './App.css'
import React from 'react'
import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { RbacProvider } from './hooks/useRbac'
import { GroupsProvider } from './hooks/useGroups'
import { UsersProvider } from './hooks/useUsers'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './views/Home'
import NewUser from './views/NewUser'
import Advanced from './views/Advanced'
import EditUser from './views/EditUser'

export default function App() {
  return (
    <BrowserRouter>
      <RbacProvider>
        <GroupsProvider>
          <UsersProvider>
            <div>
              <Header />
              <Switch>
                <Route path="/advanced" exact component={Advanced} />
                <Route path="/new-user" exact component={NewUser} />
                <Route path="/users/:username" exact component={EditUser} />
                <Route path="/" exact component={Home} />
              </Switch>
              <Footer />
            </div>
          </UsersProvider>
        </GroupsProvider>
      </RbacProvider>
    </BrowserRouter>
  )
}
