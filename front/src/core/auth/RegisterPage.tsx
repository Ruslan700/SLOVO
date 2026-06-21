import { useReducer, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { register, selectIsAuthenticated, selectAuthError, selectAuthStatus } from './authSlice';

const PageContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem 2rem;
  background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-medium) 100%);
`;

const RegisterCard = styled.div`
  background-color: var(--bg-medium);
  border: 1px solid var(--border-color);
  border-radius: 0.8rem;
  padding: 3rem;
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

const LoginLink = styled.p`
  margin: 1.6rem 0 0;
  text-align: center;
  font-size: 1.4rem;
  color: var(--txt-secondary);

  a {
    color: var(--accent-primary);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,}$/;

type FormState = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'SET_CONFIRM_PASSWORD'; payload: string }
  | { type: 'RESET' };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_NAME': return { ...state, name: action.payload };
    case 'SET_USERNAME': return { ...state, username: action.payload };
    case 'SET_EMAIL': return { ...state, email: action.payload };
    case 'SET_PASSWORD': return { ...state, password: action.payload };
    case 'SET_CONFIRM_PASSWORD': return { ...state, confirmPassword: action.payload };
    case 'RESET': return { name: '', username: '', email: '', password: '', confirmPassword: '' };
    default: return state;
  }
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const error = useAppSelector(selectAuthError);
  const status = useAppSelector(selectAuthStatus);
  const isLoading = status === 'loading';

  const [form, formDispatch] = useReducer(formReducer, {
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const usernameInvalid = form.username.length > 0 && !USERNAME_REGEX.test(form.username);
  const isFormValid =
    form.name &&
    form.username &&
    USERNAME_REGEX.test(form.username) &&
    form.email &&
    form.password &&
    form.password === form.confirmPassword;

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const result = await dispatch(register({ name: form.name, username: form.username, email: form.email, password: form.password }));
    if (register.fulfilled.match(result)) {
      formDispatch({ type: 'RESET' });
    }
  };

  return (
    <PageContainer>
      <RegisterCard>
        <CardTitle>Регистрация</CardTitle>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              type="text"
              placeholder="введите ваше имя"
              value={form.name}
              onChange={(e) => formDispatch({ type: 'SET_NAME', payload: e.target.value })}
              disabled={isLoading}
              autoComplete="name"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="username">Никнейм</Label>
            <Input
              id="username"
              type="text"
              placeholder="придумайте никнейм"
              value={form.username}
              onChange={(e) => formDispatch({ type: 'SET_USERNAME', payload: e.target.value })}
              disabled={isLoading}
              autoComplete="username"
              required
            />
            {usernameInvalid && (
              <ErrorMessage style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                Только латинские буквы, цифры и _, минимум 3 символа
              </ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="введите ваш email"
              value={form.email}
              onChange={(e) => formDispatch({ type: 'SET_EMAIL', payload: e.target.value })}
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
              placeholder="придумайте пароль"
              value={form.password}
              onChange={(e) => formDispatch({ type: 'SET_PASSWORD', payload: e.target.value })}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="повторите пароль"
              value={form.confirmPassword}
              onChange={(e) => formDispatch({ type: 'SET_CONFIRM_PASSWORD', payload: e.target.value })}
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            {passwordMismatch && (
              <ErrorMessage style={{ marginTop: '0.8rem', marginBottom: 0 }}>
                Пароли не совпадают
              </ErrorMessage>
            )}
          </FormGroup>

          <SubmitButton type="submit" disabled={isLoading || !isFormValid}>
            {isLoading ? (
              <>
                <LoadingSpinner /> Загрузка...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </SubmitButton>
        </form>
        <LoginLink>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </LoginLink>
      </RegisterCard>
    </PageContainer>
  );
};

export default RegisterPage;
