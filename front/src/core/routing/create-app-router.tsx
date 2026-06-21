import { createBrowserRouter, Navigate } from 'react-router';
import PublicLayout from '../layouts/PublicLayout';
import PrivateLayout from '../layouts/PrivateLayout';
import RequireAuth from '../auth/RequireAuth';
import LoginPage from '../auth/LoginPage';
import RegisterPage from '../auth/RegisterPage';
import ConversationsPage from '../../features/conversations/ConversationsPage';

const createAppRouter = () =>
  createBrowserRouter([
    {
      element: <PublicLayout />,
      children: [
        { path: '/login', element: <LoginPage /> },
        { path: '/register', element: <RegisterPage /> },
        { path: '/', element: <Navigate to="/login" replace /> },
      ],
    },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <PrivateLayout />,
          children: [
            { path: '/home', element: <Navigate to="/conversations" replace /> },
            { path: '/conversations', element: <ConversationsPage /> },
            { path: '/conversations/:id', element: <ConversationsPage /> },
            { path: '*', element: <Navigate to="/conversations" replace /> },
          ],
        },
      ],
    },
  ]);

export default createAppRouter;
