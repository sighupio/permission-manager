/**
 * class containing all the httpRequests
 */
import {AxiosInstance, AxiosResponse} from "axios";
import {httpClientFactory} from "./httpClient";
import {RolebindingCreateRequests} from "./rolebindingCreateRequests";
import {RolebindingDeleteRequests} from "./rolebindingDeleteRequests";
import {UserRequests} from "./userRequests";

interface NamespaceRequests {
  list(): Promise<AxiosResponse>
}
/**
 * gateway for httpRequests to the permission-manager backend
 */
class HttpRequests {
  
  public readonly rolebindingRequests: {
    create: RolebindingCreateRequests,
    delete: RolebindingDeleteRequests,
  };
  
  public readonly userRequests: UserRequests;
  
  public readonly namespaceRequests: NamespaceRequests;
  
  private httpClient: AxiosInstance;
  
  constructor(httpClientFactory: () => AxiosInstance) {
    
    this.httpClient = httpClientFactory();
    
    this.rolebindingRequests = {
      create: new RolebindingCreateRequests(httpClientFactory()),
      delete: new RolebindingDeleteRequests(httpClientFactory())
    }
    
    this.userRequests = new UserRequests(httpClientFactory());
    
    this.namespaceRequests = {
      list: this.listNamespace
    }
  }
  
  private listNamespace() {
    return this.httpClient.get('/api/list-namespace');
  }
}


export const httpRequests = new HttpRequests(httpClientFactory)
