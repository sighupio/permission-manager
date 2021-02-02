import axios, {AxiosInstance} from 'axios';


export function httpClientFactory(): AxiosInstance {
  /**
   * The HttpClient that deals with the backend requests.
   * it is possible to customize the url with the env variable REACT_APP_BACKEND_URL and BASIC_AUTH_PASSWORD.
   * Useful for local development.
   */
  const httpClient = axios.create({
    url: process.env.REACT_APP_BACKEND_URL ?? "",
    baseURL: process.env.REACT_APP_BACKEND_URL ?? ""
  })
  
  /**
   * if a BASIC_AUTH_PASSWORD is passed we inject it into {httpClient}
   */
  if (process.env.REACT_APP_BASIC_AUTH_PASSWORD) {
    httpClient.defaults.auth = {
      username: "admin", // username is always admin
      password: process.env.REACT_APP_BASIC_AUTH_PASSWORD
    }
  }
  
  return httpClient;
}

export const httpClient = httpClientFactory();
