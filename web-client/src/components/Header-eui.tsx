import React from 'react';
import {Link} from 'react-router-dom';
import {
  EuiPanel,
  EuiHeader,
  EuiButton,
  EuiSpacer,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiPageTemplate,
  EuiListGroupItem,
  EuiSkeletonRectangle,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

const Header = () => {
  return (
    <div style={{
      backgroundColor: '#38b2ac',
      height: '80px',
      padding: 26,
      }}
    >
      <EuiFlexGroup
        direction='row'
        alignItems='center'
      >
        <EuiFlexItem grow={false}>
          <EuiTitle size='s'><h2 style={{color: 'white'}}>Permission Manager</h2></EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
            <EuiFlexItem grow={false}>
              <Link to="/"><EuiText color='ghost'>Users List</EuiText></Link>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="success" href='/create-new-user' iconType='plus' iconSide='right'>Create New User</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  )
}

export default Header;
