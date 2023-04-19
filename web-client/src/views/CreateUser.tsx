import React from 'react';
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

const TemplateSelect = () => {
  return (
    <EuiFormRow label="Roles">
      <EuiSelect
        onChange={() => {}}
        options={[
          { value: 'developer', text: 'Developer' },
          { value: 'operation', text: 'Operation' },
        ]}
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

const CreateUser = () => {
  return (
    <>
      <EuiPageTemplate restrictWidth={684}>
        <EuiPageTemplate.Header
          pageTitle="Create New User"
          // rightSideItems={[
          //   <EuiButton fill>Save</EuiButton>,
          // ]}
        />
        <EuiPageTemplate.Section>
          <EuiFlexGroup direction='row'>
            <EuiFlexItem grow>
              <EuiFlexGroup direction='column'>
                <EuiFlexItem><EuiTitle><h3>User data</h3></EuiTitle></EuiFlexItem>
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
                  <EuiFormRow label="Template">
                    <EuiPanel>
                      <NameSpaceSelect />
                      <TemplateSelect />
                    </EuiPanel>
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup direction='column'>
                <EuiFlexItem grow={false}><EuiButton fill>SAVE</EuiButton></EuiFlexItem>
                {/* <EuiFlexItem><EuiTitle size='xs'><h3>Summary result</h3></EuiTitle></EuiFlexItem> */}
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
                      {field: 'namespaces', name: 'Namespaces', width: '132px', textOnly: true},
                    ]}
                    items={mockedItems as SummaryItem[]}
                    // rowProps={getRowProps}
                    // cellProps={getCellProps}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageTemplate.Section>
      </EuiPageTemplate>
    </>
  )
}

export default CreateUser;
