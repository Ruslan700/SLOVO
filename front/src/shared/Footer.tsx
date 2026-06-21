import styled from 'styled-components';
import AppLogo from './components/AppLogo/AppLogo';

const FooterWrapper = styled.footer`
  background-color: var(--bg-dark);
  border-top: 2px solid var(--border-color);
  padding: 2rem 4rem;
  text-align: center;
  z-index: var(--page-footer);
  margin-top: auto;
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const Copyright = styled.p`
  font-size: 1.4rem;
  color: var(--txt-secondary);
  margin: 0;
`;

const Footer = () => (
  <FooterWrapper>
    <FooterContent>
      <AppLogo size="3rem" />
      <Copyright>S L O V O © 2026</Copyright>
    </FooterContent>
  </FooterWrapper>
);

export default Footer;
