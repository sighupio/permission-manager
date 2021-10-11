/**
 * class containing all the httpRequests
 */
import {AxiosInstance} from "axios";
import {httpClientFactory} from "./httpClient";
import {RolebindingCreateRequests} from "./rolebindingCreateRequests";
import {RolebindingDeleteRequests} from "./rolebindingDeleteRequests";
import {UserRequests} from "./userRequests";
import {AggregatedRoleBindingNamespace} from "./role";


/**
 * gateway for httpRequests to the permission-manager backend
 */
class HttpRequests {
  
  public readonly rolebindingRequests: {
    create: RolebindingCreateRequests,
    delete: RolebindingDeleteRequests,
  };
  
  public readonly userRequests: UserRequests;
  
  
  private httpClient: AxiosInstance;
  
  constructor(httpClientFactory: () => AxiosInstance) {
    
    this.httpClient = httpClientFactory();
    
    this.rolebindingRequests = {
      create: new RolebindingCreateRequests(httpClientFactory()),
      delete: new RolebindingDeleteRequests(httpClientFactory())
    }
    
    this.userRequests = new UserRequests(httpClientFactory());
    

  }
  
  public namespaceList() {
    return this.httpClient.get('/api/list-namespace');
  }
  
  public kubeconfigCreate(username: string, chosenNamespace: string) {
    return this.httpClient.post('/api/create-kubeconfig', {
      username: username, namespace: chosenNamespace
    })
  }

  public checkLegacyUser(username: string, namespaces: AggregatedRoleBindingNamespace) {
    if (namespaces === "ALL_NAMESPACES") {
      namespaces = []
    }

    return this.httpClient.post('/api/check-legacy-user', {
      username: username, namespaces: namespaces
    })
  }
}


export const httpRequests = new HttpRequests(httpClientFactory)
