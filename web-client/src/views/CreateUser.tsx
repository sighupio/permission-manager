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
import {useHistory} from 'react-router-dom';
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
} from '@elastic/eui';
import { useNamespaceList } from '../hooks/useNamespaceList';
import { httpRequests } from '../services/httpRequests';
import { ClusterAccess } from "../components/types";
import { httpClient } from "../services/httpClient";
// import { rolebinding } from "../services/rolebindingCreateRequests";

import { AggregatedRoleBinding } from "../services/role";
import { method } from 'bluebird';
import { Subject } from '../hooks/useRbac';
import { ClusterRolebindingCreate } from '../services/rolebindingCreateRequests';

type SummaryItem = {
  resource: string,
  read: boolean,
  write: boolean,
  namespaces: string[],
}

const mockedItems: SummaryItem[] = [
  {
    resource: '*',
    read: true,
    write: false,
    namespaces: ['my-namespace', 'another-namespace'],
  },
]

const clusterAccessOptions = [
  {
    id: 'none',
    label: 'none',
  },
  {
    id: 'read',
    label: 'read',
  },
  {
    id: 'write',
    label: 'write',
  },
];

const clusterRoleMap = {
  none: false,
  read: 'read-only',
  write: 'admin'
}

const templateOptions = [
  {
    value: 'developer',
    inputDisplay: 'Developer',
  },
  {
    value: 'operation',
    inputDisplay: 'Operation',
  },
];

interface UserCreationParams {
  generated_for_user: string,
  roleName: string, // params.template,
  namespace: string, // params.namespace,
  roleKind: string, // params.roleKind,
  subjects: Subject[], // params.subjects,
  roleBindingName: string,// params.roleBindingName
};

type NamespaceOption = {
  label: string,
  value: string,
}

interface Template {
  id: number,
  namespaces: NamespaceOption[],
  role: string,
};


const CreateUser = () => {
  const [username, setUsername] = useState<string>('');
  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none');
  const [templates, setTemplates] = useState<Template[]>([{
    id: 1,
    namespaces: [],
    role: '',
  }]);

  const [successModal, setSuccessModal] = useState<boolean>(false);
  const [errorModal, setErrorModal] = useState<boolean | string>(false);
  // const [aggregatedRoleBindings, setAggregatedRoleBindings] = useState<AggregatedRoleBinding[]>([])


  // Queries
  // const listUsers = useQuery('testQuery', useUsers)


  // Mutations
  // const mutation = useMutation(postTodo, {
  //   onSuccess: () => {
  //     // Invalidate and refetch
  //     queryClient.invalidateQueries('todos')
  //   },
  // })

  // const observer = new QueryObserver(queryClient, { queryKey: ['posts'] })

  // const unsubscribe = observer.subscribe(result => {
  //   console.log(result)
  //   unsubscribe()
  // })

  const history = useHistory();

  const createUser = useMutation({
    mutationFn: (username: string) => {
      return httpRequests.userRequests.create(username)
    },
  });

  const createRoleBindings = useMutation({
    mutationFn: (params: UserCreationParams) => {
      return httpClient.post('/api/create-rolebinding', params);
    }
  });

  const createClusterRoleBindings = useMutation({
    mutationFn: (params: any) => {
      return httpClient.post('/api/create-cluster-rolebinding', params);

      // return httpRequests.rolebindingRequests.create.fromAggregatedRolebindings(
      //   [],
      //   username,
      //   clusterAccess,
      // )
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Create User Queries
      createUser.mutate(username);
      // Make a query for each template
      templates.forEach((template) => {
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
      })
      // Call to define Cluster Resources Access
      clusterAccess !== 'none' && createClusterRoleBindings.mutate({
        // aggregatedRoleBindings:[{}],
        roleName: `template-cluster-resources___${clusterRoleMap[clusterAccess]}`,
        subjects: [{kind: 'ServiceAccount', name: username, namespace: 'permission-manager'}],
        clusterRolebindingName: `${username}___template-cluster-resources___${clusterRoleMap[clusterAccess]}`,
      })

      // await httpRequests.rolebindingRequests.create.fromAggregatedRolebindings(
      //   aggregatedRoleBindings,
      //   username,
      //   clusterAccess,
      // )

      setSuccessModal(true);

      // history.push(`/users/${username}`)

    } catch (e) {
      setErrorModal(e);
      console.error('user creation error', e)
    }
  }

  // let formIsFilled = templates[0].namespaces.length && templates[0].role !== "";

  return (
    <>
      <EuiPageTemplate restrictWidth={1024}>
        <EuiPageTemplate.Header
          pageTitle="Create New User"
        />
        <EuiPageTemplate.Section>
          <EuiFlexGroup direction='row'>
            <EuiFlexItem grow style={{ maxWidth: 400 }}>
              <EuiFlexGroup direction='column'>
                <EuiFlexItem>
                  <EuiFlexGroup direction='row' justifyContent='spaceBetween'>
                    <EuiFlexItem grow={false}><EuiTitle><h3>User data</h3></EuiTitle></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiButton fill isDisabled={false} onClick={handleSubmit}>SAVE</EuiButton></EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                <EuiFlexItem grow={false}>
                  <EuiFormRow label="Username">
                    <EuiFieldText icon="user" placeholder="john.doe" onChange={(e) => setUsername(e.target.value)} />
                  </EuiFormRow>
                  <EuiFormRow label="Access to cluster resources (non-namespaced)">
                  <EuiRadioGroup
                    name="cluster-access-config"
                    options={clusterAccessOptions}
                    idSelected={clusterAccess}
                    onChange={(e) => {
                      console.log('radio', e)
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

  const onChange = (selectedRole) => {
    setTemplates(templates.map(template => {
      if (template.id === templateId) {
        return {...template, role: selectedRole}
      } else {
        return template;
      };
    }));
  };

  return (
    <EuiFormRow label="Template (of Role)">
      <EuiSuperSelect
        onChange={onChange}
        options={templateOptions}
        valueOfSelected={templates.find(t => t.id === templateId).role}
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
  const [allNamespaces, setAllNamespaces] = useState<boolean>(false);
  // const {namespaceList} = useNamespaceList();
  const { data, isError, isLoading, isSuccess } = useQuery({
    queryKey: ['listNamespaces'],
    queryFn: () => httpRequests.namespaceList(),
  })

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

  const onCheck = (e) => {
    setAllNamespaces(e.target.checked);
  };

  return (
    <EuiFormRow label="Namespace">
      <>
        <EuiComboBox
          // async
          aria-label="Namespace Selection"
          placeholder="Select Namespaces..."
          options={isSuccess ? nameSpaceOptions : []}
          selectedOptions={allNamespaces ? [{label: 'All', value: 'all'}] : templates.find(t => t.id === templateId).namespaces}
          onChange={onChange}
          isDisabled={allNamespaces}
          // onCreateOption={() => {}}
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
                    role: templateOptions[0].value,
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

export default CreateUser;
