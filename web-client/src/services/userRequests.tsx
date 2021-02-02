import {AxiosInstance} from "axios";

export class UserRequests {
  constructor(private readonly httpClient: AxiosInstance) {
  }
  
  public async create(username: string) {
    await this.httpClient.post('/api/create-user', {name: username})
  }
  
  public async delete(username: string) {
    await this.httpClient.post('/api/delete-user', {username: username})
  }
}

