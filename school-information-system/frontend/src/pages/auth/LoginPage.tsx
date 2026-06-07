import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../../store/slices/authSlice';
import type { LoginPayload } from '../../types';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type LoginForm = yup.InferType<typeof schema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const auth = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState } = useForm<LoginForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (auth.token) {
      navigate('/dashboard');
    }
  }, [auth.token, navigate]);

  const onSubmit = async (values: LoginPayload) => {
    try {
      await dispatch(login(values)).unwrap();
      enqueueSnackbar('Login successful', { variant: 'success' });
      navigate('/dashboard');
    } catch (error) {
      enqueueSnackbar('Unable to sign in. Check your credentials.', { variant: 'error' });
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back
          </Typography>
          <Typography color="text.secondary">Sign in to access the school information dashboard.</Typography>
        </Box>
        {auth.error ? <Alert severity="error">{auth.error}</Alert> : null}
        <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            {...register('email')}
            error={Boolean(formState.errors.email)}
            helperText={formState.errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            {...register('password')}
            error={Boolean(formState.errors.password)}
            helperText={formState.errors.password?.message}
          />
          <Button type="submit" variant="contained" size="large" disabled={auth.status === 'loading'}>
            Sign In
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
