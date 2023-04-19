import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { Link } from 'react-router-dom';
import {
  EuiPanel,
  EuiButton,
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiPageTemplate,
  EuiListGroupItem,
  EuiSkeletonRectangle,
} from '@elastic/eui';

const UsersList = () => {
  const { users, loading } = useUsers();
  return (
    <EuiPageTemplate
      grow={false}
      panelled={true}
      restrictWidth={600}
    >
      <EuiPageTemplate.Header
        pageTitle="Users List"
        rightSideItems={[
          <EuiButton color="success" href='/new-user' iconType='plus' iconSide='right'>Create New User</EuiButton>
        ]}
      />
      <EuiPageTemplate.Section>
        {
          loading
          ? <>
              <EuiSkeletonRectangle width="100%" height="52px" />
              <EuiSpacer size='xs' />
              <EuiSkeletonRectangle width="100%" height="52px" />
              <EuiSpacer size='xs' />
              <EuiSkeletonRectangle width="100%" height="52px" />
              <EuiSpacer size='xs' />
              <EuiSkeletonRectangle width="100%" height="52px" />
            </>
          : users.length > 0
            ? users.map(u => {
              console.log('user', u)
              return (
                <React.Fragment key={u.name}>
                  <EuiPanel paddingSize='s'>
                    <EuiFlexGroup alignItems='center'>
                      <EuiFlexItem>
                        <EuiListGroupItem label={u.name} href={`/users/${u.name}`} iconType="user" />
                      </EuiFlexItem>
                      {/* <EuiFlexItem grow={false}>
                        <EuiButtonIcon display='empty' iconType='documentEdit' color='text' aria-label='edit user' />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonIcon display='empty' iconType='trash' color='danger' aria-label='delete user' />
                      </EuiFlexItem> */}
                    </EuiFlexGroup>
                  </EuiPanel>
                  <EuiSpacer size='xs' />
                </React.Fragment>
              );
            })
            : <EuiPageTemplate.EmptyPrompt
                css={{textAlign: 'center', padding: '24px 32px'}}
                color='plain'
                iconType='users'
                title={<h5>Still no users defined</h5>}
                titleSize='s'
                actions={<EuiButtonEmpty color="success" href='/new-user' iconSide='right' iconType="plus">Create New User</EuiButtonEmpty>}
              />
        }
      </EuiPageTemplate.Section>
    </EuiPageTemplate>
  );
};

export default UsersList;
