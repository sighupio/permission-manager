import React, { useRef } from 'react';
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

const templateOptions = [
  {
    value: 'developer',
    inputDisplay: 'Developer',
  },
  {
    value: 'operation',
    inputDisplay: 'Operation',
  },
]

const TemplateSelect = () => {
  return (
    <EuiFormRow label="Template (of Role)">
      <EuiSuperSelect
        onChange={() => {}}
        options={templateOptions}
        valueOfSelected='developer'
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

const NameSpaceSelect = () => {
  const {namespaceList} = useNamespaceList()

  const options = namespaceList
    .map(ns => {
      return {label: ns.metadata.name, text: ns.metadata.name}
    })

  return (
    <EuiFormRow label="Namespace">
      <>
        <EuiComboBox
          aria-label="Namespace"
          placeholder="Select or create options"
          options={options}
          onChange={() => {}}
          onCreateOption={() => {}}
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
  const { children, index } = props;
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
              {/* <EuiButtonIcon iconType="trash" /> */}
              <EuiButtonEmpty iconSide='right' iconType='trash' color='danger' disabled>
                Delete
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size='s' />

          <TemplateSelect />
          <NameSpaceSelect />
        </EuiSplitPanel.Inner>
        {/* <EuiSplitPanel.Inner color="subdued">
          <EuiButton onClick={() => console.log('add')}>Add</EuiButton>
        </EuiSplitPanel.Inner> */}
      </EuiSplitPanel.Outer>
    </>
  )
}

const CreateUser = () => {
  return (
    <>
      <EuiPageTemplate restrictWidth={1024}>
        <EuiPageTemplate.Header
          pageTitle="Create New User"
          // rightSideItems={[
          //   <EuiButton fill>Save</EuiButton>,
          // ]}
        />
        <EuiPageTemplate.Section>
          <EuiFlexGroup direction='row'>
            <EuiFlexItem grow style={{ maxWidth: 400 }}>
              <EuiFlexGroup direction='column'>
                <EuiFlexItem>
                  <EuiFlexGroup direction='row' justifyContent='spaceBetween'>
                    <EuiFlexItem grow={false}><EuiTitle><h3>User data</h3></EuiTitle></EuiFlexItem>
                    <EuiFlexItem grow={false}><EuiButton fill>SAVE</EuiButton></EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                <EuiFlexItem grow={false}>
                  <EuiFormRow label="Username">
                    <EuiFieldText icon="user" placeholder="john.doe" />
                  </EuiFormRow>
                  <EuiFormRow label="Access to cluster resources (non-namespaced)">
                  <EuiRadioGroup
                    options={[
                      {
                        id: '1',
                        label: 'none',
                      },
                      {
                        id: '2',
                        label: 'read-only',
                      },
                      {
                        id: '3',
                        label: 'read-write',
                      },
                    ]}
                    idSelected="1"
                    onChange={() => {}}
                    name="radio group"
                    // legend={{
                    //   children: '(non-namespaced)',
                    // }}
                  />
                  </EuiFormRow>
                  <EuiSpacer size='m' />
                  {/* Template - Roles */}
                  <TemplatesSlider children={[]} />

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

export default CreateUser;