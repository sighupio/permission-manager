import {httpClient} from "./httpClient";
import {ClusterRoleBinding, RoleBinding} from "../hooks/useRbac";
import {AxiosInstance} from "axios";

class DeleteRolebindingRequests {
  public constructor(private readonly httpClient: AxiosInstance) {
  }
  
  public async rolebinding(rbs: RoleBinding[]) {
    for await (const roleBinding of rbs) {
      await this.httpClient.post('/api/delete-rolebinding', {
        rolebindingName: roleBinding.metadata.name,
        namespace: roleBinding.metadata.namespace
      })
    }
  }
  
  public async clusterRolebinding(crbs: ClusterRoleBinding[]) {
    for await (const clusterRoleBinding of crbs) {
      await this.httpClient.post('/api/delete-cluster-rolebinding', {
        rolebindingName: clusterRoleBinding.metadata.name
      })
    }
  }
}


export const rolebindingDeleteRequests = new DeleteRolebindingRequests(httpClient)
