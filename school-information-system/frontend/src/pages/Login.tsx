import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  Alert,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
  Card,
  CardActionArea,
  Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import KeyIcon from '@mui/icons-material/Key';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, clearError } from '../store/slices/authSlice';

/**
 * Form validation schema using Yup.
 */
const loginValidationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: yup.boolean().optional(),
});

type LoginFormInputs = yup.InferType<typeof loginValidationSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authState = useAppSelector((state) => (state && (state as any).auth) ?? { token: null, user: null, status: 'idle', error: null });
  const { token, status, error } = authState;

  const [showPassword, setShowPassword] = useState(false);

  // Initialize react-hook-form with Yup validation
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginValidationSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormInputs) => {
    dispatch(clearError());
    await dispatch(
      login({
        email: data.email,
        password: data.password,
      })
    );
  };

  useEffect(() => {
    if (token && status === 'succeeded') {
      navigate('/dashboard', { replace: true });
    }
  }, [token, status, navigate]);

  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  const handleAutofill = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const isLoading = status === 'loading';

  return (
    <Grid container sx={{ minHeight: '100vh', width: '100vw', maxWidth: '100vw', overflow: 'hidden', margin: '0 !important' }}>
      {/* Left Column: Premium Educational Branding Hero Section */}
      <Grid
        item
        xs={false}
        md={6}
        lg={7}
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
          color: '#ffffff',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          px: 6,
          py: 8,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)',
            backgroundSize: '30px 30px',
          },
        }}
      >
        <Stack spacing={4} sx={{ maxWidth: 620, zIndex: 2 }}>
          {/* Logo Brand Header */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                p: 1.5,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <SchoolIcon sx={{ fontSize: 32, color: '#60a5fa' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '0.02em', fontFamily: 'Outfit' }}>
              Academica<span style={{ color: '#60a5fa' }}>SIS</span>
            </Typography>
          </Stack>

          {/* Hero text */}
          <Stack spacing={2}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                lineHeight: 1.25,
                fontFamily: 'Outfit',
                letterSpacing: '-0.02em',
              }}
            >
              Manage Schools, Students, Courses, Attendance, and Academic Performance from One Unified Platform
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.1rem', fontWeight: 300 }}>
              A modern educational management system designed for administrators, teachers, and institutions.
            </Typography>
          </Stack>

          {/* SVG Illustration */}
          <Box sx={{ width: '100%', py: 2, display: 'flex', justifyContent: 'center' }}>
            <svg width="400" height="240" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="50" y="30" width="300" height="180" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <rect x="70" y="50" width="70" height="15" rx="4" fill="#60a5fa" fillOpacity="0.8" />
              <rect x="70" y="75" width="260" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
              <rect x="70" y="90" width="200" height="8" rx="4" fill="rgba(255,255,255,0.2)" />

              {/* Dashboard chart graphics inside SVG */}
              <circle cx="100" cy="155" r="25" fill="#3b82f6" fillOpacity="0.2" />
              <circle cx="100" cy="155" r="15" fill="#60a5fa" />
              <path d="M170 180 V130 M210 180 V110 M250 180 V145 M290 180 V95" stroke="#60a5fa" strokeWidth="12" strokeLinecap="round" />
              <path d="M170 180 V130 M210 180 V110 M250 180 V145 M290 180 V95" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" />

              {/* Educational graduation cap overlay */}
              <path d="M200 45 L250 30 L300 45 L250 60 Z" fill="#60a5fa" />
              <path d="M220 51 V68 C220 75 280 75 280 68 V51" fill="#3b82f6" fillOpacity="0.5" />
              <path d="M290 45 V70" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="290" cy="72" r="3" fill="#f59e0b" />
            </svg>
          </Box>
        </Stack>
      </Grid>

      {/* Right Column: Authentications Sign In Panel */}
      <Grid
        item
        xs={12}
        md={6}
        lg={5}
        component={Paper}
        elevation={0}
        square
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 4, sm: 8 },
          py: 6,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          // Fallback for dark mode or when glass effect isn't desired
          bgcolor: { xs: 'background.default', md: 'transparent' },
        }}
      >
        <Box sx={{ maxWidth: 420, width: '100%' }}>
          <Stack spacing={4}>
            {/* Header info */}
            <Stack spacing={1} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              {/* Small logo for mobile */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'flex', md: 'none' }, mb: 2, justifyContent: 'center' }}>
                <SchoolIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', fontFamily: 'Outfit' }}>
                  Academica<span style={{ color: '#2563eb' }}>SIS</span>
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 750, fontFamily: 'Outfit' }}>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to access the system dashboard.
              </Typography>
            </Stack>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => dispatch(clearError())} sx={{ borderRadius: '10px' }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                {/* Email Field */}
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Address"
                      type="email"
                      fullWidth
                      disabled={isLoading}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      autoComplete="email"
                      autoFocus
                    />
                  )}
                />

                {/* Password Field */}
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      disabled={isLoading}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      autoComplete="current-password"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />

                {/* Remembers/Forgots row */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Controller
                    name="rememberMe"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={!!field.value} color="primary" />}
                        label={<Typography variant="body2">Remember me</Typography>}
                      />
                    )}
                  />
                  <Link href="#" variant="body2" color="primary" sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Forgot password?
                  </Link>
                </Stack>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  sx={{ py: 1.5, fontSize: '1rem' }}
                >
                  {isLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Signing In...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </Stack>
            </Box>

            <Divider>
              <Typography variant="caption" color="text.disabled">
                DEMO CREDENTIALS
              </Typography>
            </Divider>

            {/* Quick Autofill Cards */}
            <Stack spacing={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Click account below to auto-fill details:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardActionArea
                      onClick={() => handleAutofill('admin@school.com', 'Admin@123')}
                      sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <KeyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Super Admin
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%' }}>
                        admin@school.com
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Pass: Admin@123
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardActionArea
                      onClick={() => handleAutofill('admin@example.com', 'admin123')}
                      sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <KeyIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Demo Admin
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%' }}>
                        admin@example.com
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Pass: admin123
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Grid>
            </Stack>

            {/* Footer Version Info */}
            <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.disabled', mt: 2 }}>
              School Information System v2.0 • AcademicaSIS
            </Typography>
          </Stack>
        </Box>
      </Grid>
    </Grid>
  );
}
