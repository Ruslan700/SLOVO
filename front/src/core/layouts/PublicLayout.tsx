import { Outlet } from 'react-router';

import Header from '../../shared/components/Header/Header';
import Footer from '../../shared/Footer';
import Page from './Page';
import Main from './Main';

const PublicLayout = () => (
  <Page>
    <Header />
    <Main>
      <Outlet />
    </Main>
    <Footer />
  </Page>
);

export default PublicLayout;
