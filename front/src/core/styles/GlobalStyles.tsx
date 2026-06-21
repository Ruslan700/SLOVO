import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  *, *::after, *::before {
    padding: 0;
    margin: 0;
    box-sizing: inherit;
  }

  html {
    font-size: 62.5%;
  }

  body {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--txt-primary);
    background-color: var(--bg-dark);
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;

export default GlobalStyles;
