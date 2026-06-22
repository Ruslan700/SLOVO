import { Link } from 'react-router';
import { useAppDispatch } from '../../../core/store/hooks';
import { logout } from '../../../core/auth/authSlice';
import styled from 'styled-components';
import AppLogo from '../AppLogo/AppLogo';

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 6rem;
  background-color: var(--bg-medium);
  border-bottom: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4rem;
  z-index: var(--page-header);

  @media (max-width: 768px) {
    padding: 0 1.6rem;
  }
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  text-decoration: none;
  color: inherit;
`;

const LogoWrapper = styled.div`
  display: flex;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--txt-primary);
  margin: 0;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavSection = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const NavLink = styled(Link)`
  color: var(--txt-primary);
  text-decoration: none;
  font-size: 1.6rem;
  font-weight: 500;
  padding: 0.8rem 1.6rem;
  border-radius: 0.4rem;
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent-primary);
    background-color: rgba(233, 69, 96, 0.1);
  }
`;

const NavButton = styled.button`
  color: var(--txt-primary);
  background-color: var(--accent-primary);
  border: none;
  font-size: 1.6rem;
  font-weight: 500;
  padding: 0.8rem 2rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #d63552;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface HeaderProps {
  isAuthenticated?: boolean;
}

const Header = ({ isAuthenticated }: HeaderProps) => {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return (
    <HeaderWrapper>
      <LogoSection as={Link} to="/">
        <LogoWrapper><AppLogo /></LogoWrapper>
        <Title>S L O V O</Title>
      </LogoSection>

      <NavSection>
        {isAuthenticated ? (
          <NavButton onClick={handleLogout}>Выйти</NavButton>
        ) : (
          <NavLink to="/login">Войти</NavLink>
        )}
      </NavSection>
    </HeaderWrapper>
  );
};

export default Header;
