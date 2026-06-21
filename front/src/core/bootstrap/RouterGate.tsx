import { RouterProvider } from 'react-router';
import appRouter from '../routing/app-router';

const RouterGate = () => <RouterProvider router={appRouter} />;

export default RouterGate;
