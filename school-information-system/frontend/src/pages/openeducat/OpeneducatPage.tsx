import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import BookIcon from '@mui/icons-material/Book';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import DnsIcon from '@mui/icons-material/Dns';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOpeneducatConfig } from '../../store/slices/openeducatSlice';
import { openeducatService } from '../../api/services/openeducatService';
import { schoolService } from '../../api/services/schoolService';

// Schema validation for the config form
const configSchema = yup.object({
  school_id: yup.number().required('School association is required'),
  base_url: yup
    .string()
    .required('Odoo/OpenEduCat URL is required')
    .url('Must be a valid URL (e.g. http://localhost:8069)'),
  database_name: yup.string().required('Database name is required'),
  username: yup.string().required('Username/Login email is required'),
  password: yup.string().when('$isEdit', {
    is: true,
    then: (schema) => schema.nullable().optional(),
    otherwise: (schema) => schema.required('Password or API Key is required'),
  }),
  is_active: yup.boolean().default(true),
});

type ConfigFormInputs = yup.InferType<typeof configSchema>;

interface SyncState {
  loading: boolean;
  success: boolean | null;
  message: string | null;
  count: number | null;
}

export function OpeneducatPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  
  // Redux state
  const { user } = useAppSelector((state) => state.auth);
  const { config, loading: configLoading } = useAppSelector((state) => state.openeducat);

  // Local component states
  const [schools, setSchools] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync operations state tracker
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({
    schools: { loading: false, success: null, message: null, count: null },
    courses: { loading: false, success: null, message: null, count: null },
    students: { loading: false, success: null, message: null, count: null },
    enrollments: { loading: false, success: null, message: null, count: null },
  });

  // React Hook Form initialization
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfigFormInputs>({
    resolver: yupResolver(configSchema),
    context: { isEdit: isEditMode },
    defaultValues: {
      school_id: user?.schoolId ? Number(user.schoolId) : undefined,
      base_url: '',
      database_name: '',
      username: '',
      password: '',
      is_active: true,
    },
  });

  // Fetch initial config and school list
  const loadData = () => {
    const params = user?.role === 'SCHOOL_ADMIN' && user.schoolId ? { school_id: Number(user.schoolId) } : {};
    dispatch(fetchOpeneducatConfig(params));

    // If SUPER_ADMIN, fetch schools list for configuration dropdown
    if (user?.role === 'SUPER_ADMIN') {
      schoolService.list({ per_page: 100 })
        .then((res) => {
          setSchools(res.items || []);
        })
        .catch(() => {
          enqueueSnackbar('Failed to load schools list', { variant: 'error' });
        });
    }
  };

  useEffect(() => {
    loadData();
  }, [dispatch, user]);

  // Handle configuration edit initialization
  const handleOpenEdit = () => {
    if (!config) return;
    setIsEditMode(true);
    reset({
      school_id: config.school_id,
      base_url: config.base_url,
      database_name: config.database_name,
      username: config.username,
      password: '', // Keep empty unless updating
      is_active: config.is_active,
    });
    setOpenDialog(true);
  };

  // Handle configuration create initialization
  const handleOpenCreate = () => {
    setIsEditMode(false);
    reset({
      school_id: user?.schoolId ? Number(user.schoolId) : undefined,
      base_url: '',
      database_name: '',
      username: '',
      password: '',
      is_active: true,
    });
    setOpenDialog(true);
  };

  // Handle save configuration payload
  const handleFormSubmit = async (data: ConfigFormInputs) => {
    setSaveLoading(true);
    try {
      if (isEditMode && config) {
        // Build payload, omit password if unchanged
        const payload: Partial<ConfigFormInputs> = { ...data };
        if (!payload.password || payload.password.trim() === '') {
          delete payload.password;
        }
        await openeducatService.update(config.id, payload);
        enqueueSnackbar('Configuration updated successfully', { variant: 'success' });
      } else {
        await openeducatService.create(data);
        enqueueSnackbar('Configuration created successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      loadData();
      setTestResult(null); // Reset connection status on edit
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to save configuration settings.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle connection testing
  const handleTestConnection = async () => {
    if (!config) return;
    setTestConnectionLoading(true);
    setTestResult(null);
    try {
      const result = await openeducatService.testConnection(config.id);
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? 'Successfully connected to Odoo Server!' : 'Connection failed.'),
      });
      if (result.success) {
        enqueueSnackbar('Connection successful!', { variant: 'success' });
      } else {
        enqueueSnackbar('Connection failed. Check diagnostics.', { variant: 'warning' });
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Unable to contact Odoo integration API.';
      setTestResult({
        success: false,
        message: msg,
      });
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setTestConnectionLoading(false);
    }
  };

  // Handle sync operations for specific resources
  const triggerSync = async (type: 'schools' | 'courses' | 'students' | 'enrollments') => {
    if (!config) return;
    
    // Update loading state
    setSyncStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], loading: true, success: null, message: null, count: null },
    }));

    try {
      let result;
      switch (type) {
        case 'schools':
          result = await openeducatService.syncSchools(config.id);
          break;
        case 'courses':
          result = await openeducatService.syncCourses(config.id);
          break;
        case 'students':
          result = await openeducatService.syncStudents(config.id);
          break;
        case 'enrollments':
          result = await openeducatService.syncEnrollments(config.id);
          break;
      }

      setSyncStates((prev) => ({
        ...prev,
        [type]: {
          loading: false,
          success: result.success,
          message: result.message || 'Synced successfully.',
          count: result.synced_count ?? null,
        },
      }));
      enqueueSnackbar(`${type.charAt(0).toUpperCase() + type.slice(1)} synced successfully!`, { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Failed to complete synchronization task.';
      setSyncStates((prev) => ({
        ...prev,
        [type]: {
          loading: false,
          success: false,
          message: msg,
          count: null,
        },
      }));
      enqueueSnackbar(`Failed to sync ${type}: ${msg}`, { variant: 'error' });
    }
  };

  // Delete configuration
  const handleDeleteConfig = async () => {
    if (!config) return;
    if (window.confirm('Are you sure you want to delete the OpenEduCat configuration? This will pause synchronization.')) {
      try {
        await openeducatService.remove(config.id);
        enqueueSnackbar('Configuration deleted successfully', { variant: 'success' });
        loadData();
        setTestResult(null);
      } catch (err) {
        enqueueSnackbar('Failed to delete integration configuration', { variant: 'error' });
      }
    }
  };

  if (configLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3} className="fade-in">
      {/* Page Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            OpenEduCat Integration Dashboard
          </Typography>
          <Typography color="text.secondary">
            Configure backend Odoo / OpenEduCat APIs, manage authentication keys, and sync academic records.
          </Typography>
        </Stack>
        {config && (
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>
            Refresh State
          </Button>
        )}
      </Stack>

      {!config ? (
        /* Empty Configuration State */
        <Card sx={{ p: 4, textAlign: 'center', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(37, 99, 235, 0.01) 100%)' }}>
          <CardContent>
            <Stack spacing={3} alignItems="center" justifyContent="center">
              <Box
                sx={{
                  bgcolor: 'rgba(37, 99, 235, 0.08)',
                  p: 3,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloudSyncIcon sx={{ fontSize: 56, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Setup OpenEduCat Integration
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 500 }}>
                No active integration settings found. Connect Odoo to synchronize institutions, branches, course syllabuses, student profiles, and grade logs automatically.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ px: 4, py: 1.2, borderRadius: '8px', fontWeight: 600 }}
              >
                Configure Connection
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        /* Configured State Grid Layout */
        <Grid container spacing={3}>
          {/* Connection Details Card */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Connection Parameters
                    </Typography>
                    <Chip
                      size="small"
                      label={config.is_active ? 'Active' : 'Disabled'}
                      color={config.is_active ? 'success' : 'default'}
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                  <Divider sx={{ mb: 2.5 }} />

                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Odoo Server Base URL
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <WifiTetheringIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
                          {config.base_url}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Database Name
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <DnsIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {config.database_name}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Username/Login Email
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <AccountCircleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {config.username}
                        </Typography>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Password / API Key Status
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ mt: 0.5, fontWeight: 600 }}>
                        •••••••••••••••• (Encrypted & Secure)
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Stack direction="row" spacing={1.5} justifyContent="flex-start">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      startIcon={testConnectionLoading ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                      sx={{ flexGrow: 1 }}
                    >
                      {testConnectionLoading ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <IconButton color="primary" onClick={handleOpenEdit} sx={{ bgcolor: 'action.hover' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={handleDeleteConfig} sx={{ bgcolor: 'error.light', color: 'error.contrastText', '&:hover': { bgcolor: 'error.main' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>

              {/* Connection Diagnostic Result Panel */}
              {testResult && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  icon={testResult.success ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                  sx={{ borderRadius: '12px', py: 1 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {testResult.success ? 'Diagnostic Success' : 'Diagnostic Error'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                    {testResult.message}
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Grid>

          {/* Sync Operations Dashboard Panel */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: '12px' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Academic Sync Services
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Manually trigger synchronization of core models from your configured OpenEduCat Odoo ERP instance.
                </Typography>
                <Divider sx={{ mb: 1 }} />

                <List disablePadding>
                  {/* Schools Sync Row */}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Paper sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.06)', borderRadius: '8px' }}>
                        <SchoolIcon sx={{ color: 'primary.main' }} />
                      </Paper>
                    </ListItemIcon>
                    <ListItemText
                      primary="Academic Schools & Branches"
                      secondary="Fetch structures, configurations, and organizational information."
                      primaryTypographyProps={{ fontWeight: 700, variant: 'subtitle2' }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {syncStates.schools.success !== null && (
                        <Chip
                          size="small"
                          label={
                            syncStates.schools.success
                              ? `Success (${syncStates.schools.count ?? 0} synced)`
                              : 'Failed'
                          }
                          color={syncStates.schools.success ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => triggerSync('schools')}
                        disabled={syncStates.schools.loading || !config.is_active}
                        startIcon={syncStates.schools.loading ? <CircularProgress size={12} /> : <PlayCircleOutlineIcon />}
                      >
                        Sync
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />

                  {/* Courses Sync Row */}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Paper sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.06)', borderRadius: '8px' }}>
                        <BookIcon sx={{ color: 'primary.main' }} />
                      </Paper>
                    </ListItemIcon>
                    <ListItemText
                      primary="Course Curriculum & Classes"
                      secondary="Fetch all academic subjects, class structures, and materials."
                      primaryTypographyProps={{ fontWeight: 700, variant: 'subtitle2' }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {syncStates.courses.success !== null && (
                        <Chip
                          size="small"
                          label={
                            syncStates.courses.success
                              ? `Success (${syncStates.courses.count ?? 0} synced)`
                              : 'Failed'
                          }
                          color={syncStates.courses.success ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => triggerSync('courses')}
                        disabled={syncStates.courses.loading || !config.is_active}
                        startIcon={syncStates.courses.loading ? <CircularProgress size={12} /> : <PlayCircleOutlineIcon />}
                      >
                        Sync
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />

                  {/* Students Sync Row */}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Paper sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.06)', borderRadius: '8px' }}>
                        <GroupIcon sx={{ color: 'primary.main' }} />
                      </Paper>
                    </ListItemIcon>
                    <ListItemText
                      primary="Student Profiles & Records"
                      secondary="Fetch students data, profiles, contacts, and personal logs."
                      primaryTypographyProps={{ fontWeight: 700, variant: 'subtitle2' }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {syncStates.students.success !== null && (
                        <Chip
                          size="small"
                          label={
                            syncStates.students.success
                              ? `Success (${syncStates.students.count ?? 0} synced)`
                              : 'Failed'
                          }
                          color={syncStates.students.success ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => triggerSync('students')}
                        disabled={syncStates.students.loading || !config.is_active}
                        startIcon={syncStates.students.loading ? <CircularProgress size={12} /> : <PlayCircleOutlineIcon />}
                      >
                        Sync
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />

                  {/* Enrollments Sync Row */}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Paper sx={{ p: 1, bgcolor: 'rgba(37, 99, 235, 0.06)', borderRadius: '8px' }}>
                        <AssignmentIndIcon sx={{ color: 'primary.main' }} />
                      </Paper>
                    </ListItemIcon>
                    <ListItemText
                      primary="Student Course Enrollments"
                      secondary="Fetch course memberships, registration lines, and schedules."
                      primaryTypographyProps={{ fontWeight: 700, variant: 'subtitle2' }}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {syncStates.enrollments.success !== null && (
                        <Chip
                          size="small"
                          label={
                            syncStates.enrollments.success
                              ? `Success (${syncStates.enrollments.count ?? 0} synced)`
                              : 'Failed'
                          }
                          color={syncStates.enrollments.success ? 'success' : 'error'}
                          variant="outlined"
                        />
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => triggerSync('enrollments')}
                        disabled={syncStates.enrollments.loading || !config.is_active}
                        startIcon={syncStates.enrollments.loading ? <CircularProgress size={12} /> : <PlayCircleOutlineIcon />}
                      >
                        Sync
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Integration Setup / Edit Modal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          {isEditMode ? 'Edit OpenEduCat Settings' : 'Configure OpenEduCat Integration'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              {/* School drop down selection for SUPER_ADMIN */}
              {user?.role === 'SUPER_ADMIN' ? (
                <Controller
                  name="school_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Associate School"
                      fullWidth
                      error={!!errors.school_id}
                      helperText={errors.school_id?.message}
                      disabled={saveLoading}
                    >
                      {schools.map((school) => (
                        <MenuItem key={school.id} value={school.id}>
                          {school.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : (
                // Hidden/automatic school configuration mapping for SCHOOL_ADMIN
                <Controller
                  name="school_id"
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} value={field.value || ''} />}
                />
              )}

              <Controller
                name="base_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Odoo Server URL"
                    placeholder="http://localhost:8069"
                    fullWidth
                    error={!!errors.base_url}
                    helperText={errors.base_url?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="database_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Odoo Database Name"
                    placeholder="e.g. odoo"
                    fullWidth
                    error={!!errors.database_name}
                    helperText={errors.database_name?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Odoo Username / Email"
                    fullWidth
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isEditMode ? 'API Key / Password (Leave empty to keep current)' : 'API Key / Password'}
                    type="password"
                    placeholder={isEditMode ? '••••••••••••••••' : 'Enter generated API key or password'}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={saveLoading}
                      />
                    }
                    label="Integration Status Active"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saveLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saveLoading}>
              {saveLoading ? <CircularProgress size={24} /> : isEditMode ? 'Save Changes' : 'Initialize Connection'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}

