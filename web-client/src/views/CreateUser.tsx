import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from 'react-query';
import {useUsers} from '../hooks/useUsers';
import {Link} from 'react-router-dom';
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
} from '@elastic/eui';
import { useNamespaceList } from '../hooks/useNamespaceList';
import { httpRequests } from '../services/httpRequests';
import { ClusterAccess } from "../components/types";
import { httpClient } from "../services/httpClient";
// import { rolebinding } from "../services/rolebindingCreateRequests";

import { AggregatedRoleBinding } from "../services/role";
import { method } from 'bluebird';
import { Subject } from '../hooks/useRbac';

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
  generate_for_user: string,
  roleName: string, // params.template,
  namespace: string, // params.namespace,
  roleKind: string, // params.roleKind,
  subjects: Subject[], // params.subjects,
  roleBindingName: string,// params.roleBindingName
};


const CreateUser = () => {
  const [username, setUsername] = useState<string>('');
  const [clusterAccess, setClusterAccess] = useState<ClusterAccess>('none');
  const [selectedNamespaces, setSelectedNamespaces] = useState<any[]>([]);
  // const [aggregatedRoleBindings, setAggregatedRoleBindings] = useState<AggregatedRoleBinding[]>([])

  const [selectedTemplateRole, setSelectedTemplateRole] = useState<string>('developer')

  // Queries
  // const listUsers = useQuery('testQuery', useUsers)


  // Mutations
  // const mutation = useMutation(postTodo, {
  //   onSuccess: () => {
  //     // Invalidate and refetch
  //     queryClient.invalidateQueries('todos')
  //   },
  // })

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

  async function handleSubmit(e) {
    e.preventDefault()

    // mutation.mutate({
    //   id: Date.now(),
    //   title: 'Do Laundry',
    // })

    try {
      // await httpRequests.userRequests.create(username)
      // Promise.all([
        createUser.mutate(username)

        createRoleBindings.mutate({
          roleName: `template-namespaced-resources___${selectedTemplateRole}`,
          namespace: selectedNamespaces[1].value,
          roleKind: 'ClusterRole',
          subjects: [{kind: 'ServiceAccount', name: username, namespace: 'permission-manager'}],
          roleBindingName: `${username}___template-namespaced-resources___${selectedTemplateRole}___${selectedNamespaces[1].value}`,
          generate_for_user: username,
        })
      // ])

      // await httpRequests.rolebindingRequests.create.fromAggregatedRolebindings(
      //   aggregatedRoleBindings,
      //   username,
      //   clusterAccess,
      // )

      // history.push(`/users/${username}`)

    } catch (e) {
      // TODO add proper error modal
      console.error('user creation error', e)
    }
  }

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
                    <EuiFlexItem grow={false}><EuiButton fill onClick={handleSubmit}>SAVE</EuiButton></EuiFlexItem>
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
                    onChange={(e) => {setClusterAccess(e as ClusterAccess)}}
                  />
                  </EuiFormRow>
                  <EuiSpacer size='m' />
                  {/* Template - Roles */}
                  <TemplatesSlider
                    children={[]}
                    selectedNamespaces={selectedNamespaces}
                    setSelectedNamespaces={setSelectedNamespaces}

                    selectedTemplateRole={selectedTemplateRole}
                    setSelectedTemplateRole={setSelectedTemplateRole}
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
                        {field: 'write', name: 'WRITE', dataType: 'boolean',
                        render: (readValue: SummaryItem['write']) => {
                          return <EuiIcon id='read1' type={readValue ? 'check' : 'cross'} />;
                        }},
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
    </>
  )
}

const TemplateSelect = (props: any) => {
  const { selectedTemplateRole, setSelectedTemplateRole } = props;

  const onChange = (selectedOptions) => {
    setSelectedTemplateRole(selectedOptions);
  };

  return (
    <EuiFormRow label="Template (of Role)">
      <EuiSuperSelect
        onChange={onChange}
        options={templateOptions}
        valueOfSelected={selectedTemplateRole}
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
  const {selectedNamespaces, setSelectedNamespaces} = props;
  const {namespaceList} = useNamespaceList();

  const nameSpaceOptions = namespaceList
    .map(ns => {
      return {label: ns.metadata.name, value: ns.metadata.name}
    })

  useEffect(() => {
    nameSpaceOptions.length && setSelectedNamespaces([nameSpaceOptions[0], nameSpaceOptions[1]])
  }, [namespaceList])

  const onChange = (selectedOptions) => {
    setSelectedNamespaces(selectedOptions);
  };

  return (
    <EuiFormRow label="Namespace">
      <>
        <EuiComboBox
          // async
          aria-label="Namespace Selection"
          placeholder="Select Namespaces..."
          options={nameSpaceOptions}
          selectedOptions={selectedNamespaces}
          onChange={onChange}
          // onCreateOption={() => {}}
          isLoading={nameSpaceOptions.length < 1}
          isClearable={true}
        />
        <EuiSpacer size='xs' />
        <EuiCheckbox
          id="check1"
          label="All Namespaces"
          checked={false}
          onChange={() => {}}
        />
      </>
    </EuiFormRow>
  )
}

const TemplatesSlider = (props: any) => {
  const { children, index, selectedNamespaces, setSelectedNamespaces, selectedTemplateRole, setSelectedTemplateRole } = props;
  const [currentPage, setCurrentPage] = React.useState(0);

  const panelContainerRef = useRef<HTMLDivElement>(null);

  const scrollLenght = 353;

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
                // onClick={() => {
                //   const newIndex = children.size + 1;
                //   const newPanel = Form.buildComponentFromSchema(
                //         newIndex,
                //         caller,
                //         formFieldData.FormId
                //       );
                //       if (newPanel) {
                //         newPanel.listenIndex({
                //           changePathsWithIndex: newIndex,
                //         });
                //         addChild(newPanel);
                //   }
                // }}
              >
                Add
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPagination
                compressed
                // aria-label={`${formFieldData.Label} pagination`}
                pageCount={children.size}
                activePage={currentPage}
                onPageClick={(activePage) => goToPage(activePage)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>

        </EuiFlexItem>

      </EuiFlexGroup>
      <EuiSpacer size='xs' />
      <EuiSplitPanel.Outer>
        <EuiSplitPanel.Inner>
          <EuiFlexGroup direction='row' justifyContent='spaceBetween' alignItems='center'>
            <EuiFlexItem>
              <EuiTitle size='xs'><h5># {index}</h5></EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconSide='right'
                iconType='trash'
                color='danger'
                disabled
                onClick={() => console.log('delete template')}>
                Delete
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size='s' />

          <TemplateSelect
            selectedTemplateRole={selectedTemplateRole}
            setSelectedTemplateRole={setSelectedTemplateRole}
          />
          <NameSpaceSelect
            selectedNamespaces={selectedNamespaces}
            setSelectedNamespaces={setSelectedNamespaces}
          />
        </EuiSplitPanel.Inner>
        {/* <EuiSplitPanel.Inner color="subdued">
          <EuiButton onClick={() => console.log('add')}>Add</EuiButton>
        </EuiSplitPanel.Inner> */}
      </EuiSplitPanel.Outer>
    </>
  )
}

export default CreateUser;
