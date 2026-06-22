import { Outlet } from 'react-router';
import styled from 'styled-components';

import Header from '../../shared/components/Header/Header';
import Page from './Page';
import Main from './Main';

const PrivateMain = styled(Main)`
  padding: 2rem 4rem;

  @media (max-width: 768px) {
    padding: 0;
  }
`;

const PrivateLayout = () => (
  <Page>
    <Header isAuthenticated />
    <PrivateMain>
      <Outlet />
    </PrivateMain>
  </Page>
);

export default PrivateLayout;
