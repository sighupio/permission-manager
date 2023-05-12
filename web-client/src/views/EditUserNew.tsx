import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueriesObserver,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {useUsers} from '../hooks/useUsers';
import {useHistory, useParams} from 'react-router-dom';
import {
  EuiPanel,
  EuiButton,
  EuiSpacer,
  EuiFormRow,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFieldText,
  EuiButtonEmpty,
  EuiPageTemplate,
  EuiListGroupItem,
  EuiSkeletonRectangle,
  EuiSelect,
  EuiTitle,
  EuiComboBox,
  EuiRadioGroup,
  EuiCheckbox,
  EuiTable,
  EuiBasicTable,
  EuiIcon,
  EuiSplitPanel,
  EuiPagination,
  EuiButtonIcon,
  EuiSuperSelect,
  EuiTextColor,
  EuiText,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiHorizontalRule,
} from '@elastic/eui';
import { useNamespaceList } from '../hooks/useNamespaceList';
import { httpRequests } from '../services/httpRequests';
import { ClusterAccess } from "../components/types";
import { httpClient } from "../services/httpClient";
import { Subject, useRbac } from '../hooks/useRbac';
import { extractUsersRoles } from '../services/role';

type SummaryItem = {
  resource: string,
  read: boolean,
  write: boolean,
  namespaces: string[],
};

const mockedItems: SummaryItem[] = [
  {
    resource: '*',
    read: true,
    write: false,
    namespaces: ['my-namespace', 'another-namespace'],
  },
];

const clusterAccessOptions = [
  {
    id: 'none',
    label: 'none',
  },
  {
    id: 'read',
    label: 'read-only',
  },
  {
    id: 'write',
    label: 'read-write',
  },
];

const clusterRoleMap = {
  none: false,
  read: 'read-only',
  write: 'admin'
};

interface UserCreationParams {
  generated_for_user: string,
  roleName: string,
  namespace: string,
  roleKind: string,
  subjects: Subject[],
  roleBindingName: string,
};

type NamespaceOption = {
  label: string,
  value: string,
};

interface Template {
  id: number,
  namespaces: NamespaceOption[],
  role: string,
};



const EditUser = () => {
  const { username }: {username: string} = useParams();
  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none');
  const [templates, setTemplates] = useState<Template[]>([{
    id: 1,
    namespaces: [],
    role: '',
  }]);

  const [successModal, setSuccessModal] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<boolean | string>(false);

  const { users } = useUsers();
  const { clusterRoleBindings, roleBindings, refreshRbacData } = useRbac();

  console.log(useRbac())


  useEffect(() => {
    let { extractedPairItems, crbs } = extractUsersRoles(roleBindings, clusterRoleBindings, username);

    const reFormatTemplates = extractedPairItems.map((template, index) => {
      // Format templates
      return {
        id: index + 1,
        namespaces: (template.namespaces as string[]).map(ns => {
          return {
            value: ns,
            label: ns,
          }
        }),
        role: template.template //.replace('template-namespaced-resources___','')
      };
    });

    const clusterAccess = crbs.find(crb => crb.metadata.name.includes('template-cluster-resources___'))
    const formattedClusterAccess = clusterAccess && clusterAccess.roleRef.name.replace('template-cluster-resources___', '')

    const entries = Object.entries(clusterAccessOptions);

    console.log('ENTRUE', entries)

    // const access = entries.find(c => c.value === formattedClusterAccess)

    setClusterAccess(formattedClusterAccess as ClusterAccess);
    setTemplates(reFormatTemplates as any);
  }, [roleBindings, clusterRoleBindings, username]);

  const history = useHistory();

  const createUser = useMutation({
    mutationFn: (username: string) => {
      return httpClient.post('/api/create-user', {name: username});
    },
    onError(error, variables, context) {
      setErrorModal(error.toString());
    },
  });

  const createRoleBindings = useMutation({
    mutationFn: (params: UserCreationParams) => {
      return httpClient.post('/api/create-rolebinding', params);
    },
    onError(error, variables, context) {
      setErrorModal(error.toString());
    },
  });

  const createClusterRoleBindings = useMutation({
    mutationFn: (params: any) => {
      return httpClient.post('/api/create-cluster-rolebinding', params);
    },
    onError(error, variables, context) {
      setErrorModal(error.toString())
    },
  });

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      Promise.all([
        // Create User Queries
        createUser.mutate(username),

        // Make a query for each template
        templates.forEach((template) => {
          // Check for ALL_NAMESPACES case (that can be composed by one namespace only)
          if (template.namespaces[0].value === 'all') {
            createClusterRoleBindings.mutate({
              roleName: `template-cluster-resources___${template.role}`,
              subjects: [{kind: 'ServiceAccount', name: username, namespace: 'permission-manager'}],
              clusterRolebindingName: `${username}___template-cluster-resources___${template.role}all_namespaces`,
            })
            return
          } else {
            // API as of now needs to be called one time for each namespace
            template.namespaces.forEach((ns) => {
              createRoleBindings.mutate({
                roleName: `template-namespaced-resources___${template.role}`,
                namespace: ns.value,
                roleKind: 'ClusterRole',
                subjects: [{kind: 'ServiceAccount', name: username, namespace: 'permission-manager'}],
                roleBindingName: `${username}___template-namespaced-resources___${template.role}___${ns.value}`,
                generated_for_user: username,
              })
            });
          }
        }),

        // Call to define Cluster Resources Access
        clusterAccess !== 'none' && createClusterRoleBindings.mutate({
          roleName: `template-cluster-resources___${clusterRoleMap[clusterAccess]}`,
          subjects: [{kind: 'ServiceAccount', name: username, namespace: 'permission-manager'}],
          clusterRolebindingName: `${username}___template-cluster-resources___${clusterRoleMap[clusterAccess]}`,
        })
      ]).then(res => {
        console.log('calls done', res);
      });

    } catch (e) {
      setErrorModal(e.toString());
      console.error('user creation error', e)
    } finally {
      !errorModal && setSuccessModal(true);
    };
  };

  let formIsFilled =
    templates.every(t => t.namespaces.length) &&
    templates.every(t => t.role !== "")

  let formIsModified = null;

  return (
    <>
      <EuiPageTemplate restrictWidth={1024}>
        <EuiPageTemplate.Header
          pageTitle="Edit User"
        />
        <EuiPageTemplate.Section>
          <EuiFlexGroup direction='row'>
            <EuiFlexItem grow style={{ maxWidth: 400 }}>
              <EuiFlexGroup direction='column'>
                <EuiFlexItem>
                  <EuiFlexGroup direction='row' justifyContent='spaceBetween'>
                    <EuiFlexItem grow={false}><EuiTitle><h3>User data</h3></EuiTitle></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiButton color='danger' onClick={() => console.log('delete')}>Delete</EuiButton></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiButton fill isDisabled={!formIsFilled} onClick={handleSubmit}>EDIT</EuiButton></EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                <EuiFlexItem grow={false}>
                  <EuiFormRow label="Username" isDisabled={true}>
                    <>
                      <EuiText size='m'><strong>{username}</strong></EuiText>
                      <EuiHorizontalRule margin='xs' />
                    </>
                  </EuiFormRow>
                  <EuiFormRow label="Access to cluster resources (non-namespaced)">
                  <EuiRadioGroup
                    name="cluster-access-config"
                    options={clusterAccessOptions}
                    idSelected={clusterAccess}
                    onChange={(e) => {
                      setClusterAccess(e as any)
                    }}
                  />
                  </EuiFormRow>
                  <EuiSpacer size='m' />
                  {/* Template - Roles */}
                  <TemplatesSlider
                    templates={templates}
                    setTemplates={setTemplates}
                  />

                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow>
              <EuiPanel color='subdued'>
                <EuiFlexGroup direction='column'>
                  <EuiFlexItem grow={false}>
                    <EuiTitle size='s'>
                      <h3><EuiTextColor color="subdued">Summary</EuiTextColor></h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiBasicTable
                      tableCaption="Summary"
                      // rowHeader="firstName"
                      tableLayout='auto'
                      columns={[
                        {field: 'resource', name: 'Resource', dataType: 'string'},
                        {
                          field: 'read',
                          name: 'READ',
                          dataType: 'boolean',
                          render: (readValue: SummaryItem['read']) => {
                            return <EuiIcon id='read1' type={readValue ? 'check' : 'cross'} />;
                          }
                        },
                        {
                          field: 'write', name: 'WRITE', dataType: 'boolean',
                          render: (readValue: SummaryItem['write']) => {
                            return <EuiIcon id='read1' type={readValue ? 'check' : 'cross'} />;
                          }
                        },
                        {field: 'namespaces', name: 'Namespaces', textOnly: true},
                      ]}
                      items={mockedItems as any}
                      // rowProps={getRowProps}
                      // cellProps={getCellProps}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageTemplate.Section>
      </EuiPageTemplate>

      {successModal &&
        <EuiModal
          onClose={() => {
            setSuccessModal(false);
            history.push('/')
          }}
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>Good</EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            User succesfully created
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton
              onClick={() => {
                setSuccessModal(false);
                history.push('/')
              }}
              fill
            >
              OK
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      }

      {errorModal &&
        <EuiModal onClose={() => {
          setErrorModal(false);
        }}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>Error</EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            {errorModal}
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton
              fill
              color='danger'
              onClick={() => {
                setErrorModal(false);
              }}
            >
              Close
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      }
    </>
  )
}

const RoleSelect = (props: any) => {
  const { templates, setTemplates, templateId } = props;

  const { clusterRoles } = useRbac();
  // Extrac roles from rbac info
  const templateNames = (clusterRoles || [])
    .map(role => role.metadata.name)
    .filter(role => role.startsWith('template-namespaced-resources___'));

  // Map roles into selectable options
  const options = templateNames.map(templateRole => {
    const parsedRoleName = templateRole.replace('template-namespaced-resources___', '');
    return {
      value: parsedRoleName,
      inputDisplay: parsedRoleName,
    };
  });

  useEffect(() => {
    // Set preselected role
    options.length && setTemplates(templates.map(template => {
      if (template.id === templateId) {
        return {...template, role: options[0].value};
      } else {
        return template;
      };
    }));
  }, [options.length]);

  const onChange = (selectedRole) => {
    setTemplates(templates.map(template => {
      if (template.id === templateId) {
        return {...template, role: selectedRole};
      } else {
        return template;
      };
    }));
  };

  return (
    <EuiFormRow label="Template (of Role)">
      <EuiSuperSelect
        onChange={onChange}
        options={options}
        valueOfSelected={templates.find(t => t.id === templateId)?.role.replace('template-namespaced-resources___', '')}
        append={
          <EuiButtonEmpty
            iconType='iInCircle'
            iconSide='right'
            onClick={() => console.log('info')}
          >
            Info
          </EuiButtonEmpty>
        }
      />
    </EuiFormRow>
  )
}

const NameSpaceSelect = (props: any) => {
  const { templates, setTemplates, templateId } = props;
  console.log('templates', templates)
  const [allNamespaces, setAllNamespaces] = useState<boolean>(false);
  // const {namespaceList} = useNamespaceList();
  const { data, isError, isLoading, isSuccess } = useQuery({
    queryKey: ['listNamespaces'],
    queryFn: () => httpRequests.namespaceList(),
  });

  const nameSpaceOptions = !isLoading && !isError && data.data.namespaces
    .map((ns: NamespaceOption) => {
      return {label: ns, value: ns}
    });

  const onChange = (selectedOptions) => {
    setTemplates(templates.map(template => {
      if (template.id === templateId) {
        return {...template, namespaces: selectedOptions}
      } else {
        return template
      }
    }))
  };

  useEffect(() => {
    if (allNamespaces) {
      // Remove all namespaces and fill with ['all']
      setTemplates(templates.map(template => {
        if (template.id === templateId) {
          return {...template, namespaces: [{value: 'all', label: 'All'}]}
        } else {
          return template
        }
      }))
    } else {
      // Empty selection
      setTemplates(templates.map(template => {
        if (template.id === templateId) {
          return {...template, namespaces: []}
        } else {
          return template
        }
      }))
    }
  }, [allNamespaces]);

  useEffect(() => {
    // Force re-render on load
    setTemplates([...templates]);
  }, [])

  const onCheck = (e) => {
    setAllNamespaces(e.target.checked);
  };

  return (
    <EuiFormRow label="Namespace">
      <>
        <EuiComboBox
          aria-label="Namespace Selection"
          placeholder="Select Namespaces..."
          options={isSuccess ? nameSpaceOptions : []}
          // TODO: check deletion corner cases
          selectedOptions={allNamespaces ? [{label: 'All', value: 'all'}] : (templates.find(t => t.id === templateId)?.namespaces ?? [])}
          onChange={onChange}
          isDisabled={allNamespaces}
          isLoading={!nameSpaceOptions}
          isClearable={true}
        />
        <EuiSpacer size='xs' />
        <EuiCheckbox
          id="check1"
          label="All Namespaces"
          checked={allNamespaces}
          onChange={onCheck}
        />
      </>
    </EuiFormRow>
  )
}

const TemplatesSlider = (props: any) => {
  const { templates, setTemplates } = props;
  const [currentPage, setCurrentPage] = useState(0);
  const panelContainerRef = useRef<HTMLDivElement>(null);

  const scrollLenght = 424;

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    panelContainerRef.current?.scrollTo(scrollLenght * pageNumber, 0);
  };

  useEffect(() => {
    // Automatic scroll after template Add
    if (templates.length > 1) {
      setCurrentPage(templates.length - 1)
      panelContainerRef.current?.scrollTo(scrollLenght * templates.length -1 , 0);
    }
  }, [templates.length])

  return (
    <>
      <EuiFlexGroup direction="row" alignItems='center' justifyContent='spaceBetween'>
        <EuiFlexItem><EuiText color='subdued' size='xs'><b>TEMPLATES</b></EuiText></EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup justifyContent='flexEnd' alignItems='center' gutterSize='xs'>
            <EuiFlexItem>
              <EuiButtonEmpty
                iconType="plusInCircle"
                iconSide='right'
                size="s"
                onClick={() => {
                  setTemplates([...templates, {
                    id: templates.length + 1,
                    namespaces: [],
                    role: '',
                  }]);
                }}
              >
                Add
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPagination
                compressed
                activePage={currentPage}
                pageCount={templates.length}
                aria-label="templates pagination"
                onPageClick={(activePage) => goToPage(activePage)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>

        </EuiFlexItem>

      </EuiFlexGroup>
      <EuiSpacer size='xs' />
      <div
        ref={panelContainerRef}
        className='templates-container'
        style={{display: 'flex', flexWrap: 'nowrap', overflowX: 'hidden', scrollBehavior: 'smooth', margin: '-8px -12px -24px'}}
      >
        {templates.map((template, index) => {
          return(
            <div key={`template_${index + 1}`} style={{flex: '0 0 auto', width: '100%', padding: '8px 12px 24px'}}>
              <EuiPanel grow={false}>
                <EuiFlexGroup direction='row' justifyContent='spaceBetween' alignItems='center'>
                  <EuiFlexItem>
                    <EuiTitle size='xs'><h5># {index + 1}</h5></EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconSide='right'
                      iconType='trash'
                      color='danger'
                      isDisabled={template.id === 1}
                      onClick={() => {
                        // Deleting template
                        console.log('delete template', template.id);
                        setTemplates(templates.filter(t => t.id !== template.id))
                      }}
                    >
                      Delete
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>

                <EuiSpacer size='s' />

                <RoleSelect
                  templateId={index + 1}
                  templates={templates}
                  setTemplates={setTemplates}
                  />
                <NameSpaceSelect
                  templateId={index + 1}
                  templates={templates}
                  setTemplates={setTemplates}
                />
              </EuiPanel>
              {/* <EuiSplitPanel.Inner color="subdued">
                <EuiButton onClick={() => console.log('add')}>Add</EuiButton>
              </EuiSplitPanel.Inner> */}
            </div>
          )
        })}
      </div>
    </>
  )
}

export default EditUser;
