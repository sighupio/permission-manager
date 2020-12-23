import axios from 'axios';


const httpClient = axios.create({
  url: process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : "http://localhost",
})

export {httpClient}
