import {AxiosInstance} from "axios";
import {httpClient} from "./httpClient";

class UserRequests {
  constructor(private readonly httpClient: AxiosInstance) {
  }
  
  public async create(username: string) {
    await httpClient.post('/api/create-user', {name: username})
  }
  
  public async delete(username: string) {
    await httpClient.post('/api/delete-user', {username: username})
  }
}

export const userRequests = new UserRequests(httpClient)
