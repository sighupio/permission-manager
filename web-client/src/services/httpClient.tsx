import axios from 'axios';


/**
 * it is possible to customize the url with the env variable REACT_APP_BACKEND_URL.
 * Useful for local development.
 */
const httpClient = axios.create({
  url: process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : "",
  baseURL: process.env.REACT_APP_BACKEND_URL ? process.env.REACT_APP_BACKEND_URL : "",
})


export {httpClient}
