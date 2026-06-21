import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMe, selectAuthInitialized } from '../auth/authSlice';

const AppBootstrap = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);

  useEffect(() => {
    if (!initialized) {
      void dispatch(fetchMe());
    }
  }, [dispatch, initialized]);

  return null;
};

export default AppBootstrap;
