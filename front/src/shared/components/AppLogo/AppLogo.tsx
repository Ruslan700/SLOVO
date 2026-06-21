import styled from 'styled-components';

interface AppLogoProps {
  size?: string;
}

const LogoSvg = styled.svg<{ $size: string }>`
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  fill: var(--accent-primary);
`;

const AppLogo = ({ size = '4rem' }: AppLogoProps) => (
  <LogoSvg viewBox="0 0 100 100" $size={size}>
    <circle cx="50" cy="30" r="15" />
    <path d="M 30 50 Q 50 65 70 50 L 65 80 Q 50 90 35 80 Z" />
  </LogoSvg>
);

export default AppLogo;
