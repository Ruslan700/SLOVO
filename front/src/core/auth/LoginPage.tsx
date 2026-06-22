import { useReducer, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, selectIsAuthenticated, selectAuthError, selectAuthStatus } from './authSlice';

const PageContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem;
  background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-medium) 100%);

  @media (max-width: 768px) {
    align-items: flex-start;
    padding: 4rem 1.6rem 2rem;
  }
`;

const LoginCard = styled.div`
  background-color: var(--bg-medium);
  border: 1px solid var(--border-color);
  border-radius: 0.8rem;
  padding: 3rem;

  @media (max-width: 768px) {
    padding: 2rem 1.6rem;
  }
  width: 100%;
  max-width: 40rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const CardTitle = styled.h2`
  font-size: 2.4rem;
  font-weight: 700;
  color: var(--txt-primary);
  margin: 0 0 2rem;
  text-align: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FormGroup = styled.div`
  margin-bottom: 1.6rem;

  &:last-of-type {
    margin-bottom: 2rem;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--txt-secondary);
  margin-bottom: 0.6rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  font-size: 1.4rem;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  color: var(--txt-primary);
  transition: all 0.3s ease;
  box-sizing: border-box;

  &::placeholder {
    color: var(--txt-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--txt-primary);
  background: linear-gradient(135deg, var(--accent-primary), #d63552);
  border: none;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(233, 69, 96, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  margin-bottom: 1.6rem;
  background-color: rgba(233, 69, 96, 0.1);
  border: 1px solid var(--accent-primary);
  border-radius: 0.4rem;
  color: #ff6b7a;
  font-size: 1.4rem;
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoadingSpinner = styled.span`
  display: inline-block;
  width: 1.6rem;
  height: 1.6rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--txt-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

type FormState = {
  email: string;
  password: string;
};

type FormAction = {
  type: 'SET_EMAIL' | 'SET_PASSWORD' | 'RESET';
  payload?: string;
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload || '' };
    case 'SET_PASSWORD':
      return { ...state, password: action.payload || '' };
    case 'RESET':
      return { email: '', password: '' };
    default:
      return state;
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const status = useAppSelector(selectAuthStatus);
  const isLoading = status === 'loading';

  const [form, formDispatch] = useReducer(formReducer, { email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    const result = await dispatch(login({ email: form.email, password: form.password }));
    if (login.fulfilled.match(result)) {
      formDispatch({ type: 'RESET' });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formDispatch({ type: 'SET_EMAIL', payload: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formDispatch({ type: 'SET_PASSWORD', payload: e.target.value });
  };

  return (
    <PageContainer>
      <LoginCard>
        <CardTitle>Добро пожаловать</CardTitle>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="введите ваш email"
              value={form.email}
              onChange={handleEmailChange}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="введите ваш пароль"
              value={form.password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading || !form.email || !form.password}>
            {isLoading ? (
              <>
                <LoadingSpinner /> Загрузка...
              </>
            ) : (
              'Войти'
            )}
          </SubmitButton>
        </form>
        <p style={{ margin: '1.6rem 0 0', textAlign: 'center', fontSize: '1.4rem', color: 'var(--txt-secondary)' }}>
          Нет аккаунта?{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
            Зарегистрироваться
          </Link>
        </p>
      </LoginCard>
    </PageContainer>
  );
};

export default LoginPage;
