import { RolebindingCreateRequests } from './rolebindingCreateRequests';
import { AggregatedRoleBinding } from './role';
import { ClusterAccess } from '../components/types';

// Mock axios
const mockAxios = {
  post: jest.fn(),
};

describe('RolebindingCreateRequests', () => {
  let rolebindingCreateRequests: RolebindingCreateRequests;

  beforeEach(() => {
    jest.clearAllMocks();
    rolebindingCreateRequests = new RolebindingCreateRequests(mockAxios as any);
  });

  describe('fromAggregatedRolebindings', () => {
    it('should create subjects array with ServiceAccount and additional subject', async () => {
      const aggregatedRoleBindings: AggregatedRoleBinding[] = [
        {
          template: 'test-template',
          namespaces: ['default']
        }
      ];
      const username = 'test-user';
      const clusterAccess: ClusterAccess = 'read';

      // Mock successful responses
      mockAxios.post.mockResolvedValue({});

      await rolebindingCreateRequests.fromAggregatedRolebindings(
        aggregatedRoleBindings,
        username,
        clusterAccess
      );

      // Verify that rolebinding was called with correct subjects
      expect(mockAxios.post).toHaveBeenCalledWith('/api/create-rolebinding', {
        roleName: 'test-template',
        namespace: 'default',
        roleKind: 'ClusterRole',
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'test-user',
            namespace: 'permission-manager'
          },
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User', // Should use ADDITIONAL_SUBJECT_KIND constant
            name: 'test-user'
          }
        ],
        roleBindingName: 'test-user___test-template___default',
        generated_for_user: 'test-user'
      });

      // Verify that cluster rolebinding was called
      expect(mockAxios.post).toHaveBeenCalledWith('/api/create-cluster-rolebinding', {
        roleName: 'template-cluster-resources___read-only',
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'test-user',
            namespace: 'permission-manager'
          },
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'test-user'
          }
        ],
        clusterRolebindingName: 'test-user___template-cluster-resources___read-only'
      });
    });

    it('should handle ALL_NAMESPACES rolebindings correctly', async () => {
      const aggregatedRoleBindings: AggregatedRoleBinding[] = [
        {
          template: 'all-namespaces-template',
          namespaces: 'ALL_NAMESPACES'
        }
      ];
      const username = 'test-user';
      const clusterAccess: ClusterAccess = 'none';

      mockAxios.post.mockResolvedValue({});

      await rolebindingCreateRequests.fromAggregatedRolebindings(
        aggregatedRoleBindings,
        username,
        clusterAccess
      );

      // Should call cluster rolebinding for ALL_NAMESPACES
      expect(mockAxios.post).toHaveBeenCalledWith('/api/create-cluster-rolebinding', {
        roleName: 'all-namespaces-template',
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'test-user',
            namespace: 'permission-manager'
          },
          {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'User',
            name: 'test-user'
          }
        ],
        clusterRolebindingName: 'test-user___all-namespaces-templateall_namespaces'
      });
    });
  });
});
