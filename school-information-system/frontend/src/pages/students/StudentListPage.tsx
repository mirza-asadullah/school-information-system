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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  Checkbox,
  InputAdornment,
  Skeleton,
  Chip,
  Tooltip,
  Grid,
  Drawer,
  Avatar,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import GroupIcon from '@mui/icons-material/Group';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchSchools } from '../../store/slices/schoolSlice';
import { studentService } from '../../api/services/studentService';

// Schema for student validations
const studentSchema = yup.object({
  first_name: yup.string().required('First name is required').min(2, 'Must be at least 2 characters'),
  last_name: yup.string().required('Last name is required').min(2, 'Must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Must be a valid email'),
  phone: yup.string().nullable().optional(),
  gender: yup.string().required('Gender is required').oneOf(['Male', 'Female', 'Other']),
  date_of_birth: yup.string().required('Date of Birth is required'),
  admission_no: yup.string().required('Admission number is required'),
  school_id: yup.number().required('School assignment is required').typeError('School assignment is required'),
  status: yup.string().required('Status is required').oneOf(['active', 'inactive', 'pending']),
});

type StudentFormInputs = yup.InferType<typeof studentSchema>;

export function StudentListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  
  // Select state from slices
  const { items: students, loading: studentsLoading } = useAppSelector((state) => state.students);
  const { items: schools } = useAppSelector((state) => state.schools);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Table sorting
  const [sortField, setSortField] = useState('first_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormInputs>({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: 'Male',
      date_of_birth: '',
      admission_no: '',
      school_id: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    dispatch(fetchStudents());
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleOpenCreate = () => {
    if (schools.length === 0) {
      enqueueSnackbar('Please register at least one school before adding students.', { variant: 'warning' });
      return;
    }
    setEditingStudent(null);
    reset({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      gender: 'Male',
      date_of_birth: '',
      admission_no: `ADM-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      school_id: schools[0]?.id || undefined,
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    reset({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      gender: (student.gender as 'Male' | 'Female' | 'Other') || 'Male',
      date_of_birth: student.date_of_birth || '',
      admission_no: student.admission_no,
      school_id: student.school_id,
      status: (student.status as 'active' | 'inactive' | 'pending') || 'active',
    });
    setOpenDialog(true);
  };

  const handleFormSubmit = async (data: StudentFormInputs) => {
    setSaveLoading(true);
    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, data);
        enqueueSnackbar('Student profile updated successfully', { variant: 'success' });
      } else {
        await studentService.create(data);
        enqueueSnackbar('Student admitted successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchStudents());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred while saving student info.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const headers = ['ID', 'Admission No', 'Name', 'Email', 'Phone', 'Gender', 'DOB', 'School ID', 'Status'];
    const rows = students.map((s: any) => [
      s.id,
      s.admission_no,
      `"${s.first_name} ${s.last_name}"`,
      s.email,
      s.phone || '',
      s.gender || '',
      s.date_of_birth || '',
      s.school_id,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleSelectAllRows = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const pageRows = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((r: any) => String(r.id));
      setSelectedRows([...new Set([...selectedRows, ...pageRows])]);
    } else {
      const pageRows = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((r: any) => String(r.id));
      setSelectedRows(selectedRows.filter(id => !pageRows.includes(id)));
    }
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filters & Sorting over records
  const filteredItems = students
    .filter((student: any) => {
      const fullname = `${student.first_name} ${student.last_name}`.toLowerCase();
      const matchesSearch = fullname.includes(searchQuery.toLowerCase()) || 
                            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            student.admission_no.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSchool = schoolFilter === 'all' || student.school_id === Number(schoolFilter);
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesSchool && matchesStatus;
    })
    .sort((a: any, b: any) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Paginated records
  const paginatedItems = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header sections */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Student Management
          </Typography>
          <Typography color="text.secondary">
            Manage student admissions, credentials, personal details, and records.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={students.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Admit Student
          </Button>
        </Stack>
      </Stack>

      {/* Main Datagrid Card */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Filtering and query panels */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ p: 2.5 }}
          >
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  placeholder="Search by name, adm no, email..."
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Filter by School"
                  size="small"
                  fullWidth
                  value={schoolFilter}
                  onChange={(e) => {
                    setSchoolFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Schools</MenuItem>
                  {schools.map((s: any) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Filter by Status"
                  size="small"
                  fullWidth
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>

          {/* Table Container */}
          <TableContainer component={Box} sx={{ borderTop: `1px solid ${theme => theme.palette.divider}` }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedItems.length}
                      checked={paginatedItems.length > 0 && paginatedItems.every((r: any) => selectedRows.includes(String(r.id)))}
                      onChange={handleSelectAllRows}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleSort('admission_no')} sx={{ cursor: 'pointer' }}>
                    Adm No {sortField === 'admission_no' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('first_name')} sx={{ cursor: 'pointer' }}>
                    Student Name {sortField === 'first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('email')} sx={{ cursor: 'pointer' }}>
                    Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Assigned School</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsLoading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                      <Stack spacing={2} alignItems="center" justifyContent="center">
                        <Box
                          sx={{
                            bgcolor: 'rgba(124, 58, 237, 0.08)',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <GroupIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Students Found
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          There are no student profiles matching the filters. Create your first student profile to start.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Admit New Student
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((student: any) => {
                    const isRowSelected = selectedRows.includes(String(student.id));
                    const studentSchoolName = schools.find((s: any) => s.id === student.school_id)?.name || 'Unknown School';
                    return (
                      <TableRow key={student.id} hover selected={isRowSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(String(student.id))}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {student.admission_no}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.75rem' }}>
                              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {student.first_name} {student.last_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{studentSchoolName}</TableCell>
                        <TableCell>{student.gender || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={student.status}
                            color={student.status === 'active' ? 'success' : student.status === 'pending' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View Profile Info">
                              <IconButton size="small" onClick={() => setViewingStudent(student)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Profile Details">
                              <IconButton size="small" onClick={() => handleOpenEdit(student)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Simple Pagination controls */}
          {filteredItems.length > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} student profiles
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Page {page + 1}
                </Typography>
                <Button
                  size="small"
                  disabled={(page + 1) * rowsPerPage >= filteredItems.length}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Profile Details Slider Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(viewingStudent)}
        onClose={() => setViewingStudent(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3 } }}
      >
        {viewingStudent && (
          <Stack spacing={3}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              Student Profile Summary
            </Typography>
            <Divider />
            
            <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: '2rem', fontWeight: 600 }}>
                {viewingStudent.first_name.charAt(0)}{viewingStudent.last_name.charAt(0)}
              </Avatar>
              <Stack spacing={0.5} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {viewingStudent.first_name} {viewingStudent.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admission No: {viewingStudent.admission_no}
                </Typography>
                <Chip size="small" label={viewingStudent.status} color={viewingStudent.status === 'active' ? 'success' : 'default'} />
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  School Assignment
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {schools.find((s: any) => s.id === viewingStudent.school_id)?.name || 'Unknown School'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Email Address
                </Typography>
                <Typography variant="body2">{viewingStudent.email}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Phone Number
                </Typography>
                <Typography variant="body2">{viewingStudent.phone || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Gender
                </Typography>
                <Typography variant="body2">{viewingStudent.gender}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Date of Birth
                </Typography>
                <Typography variant="body2">{viewingStudent.date_of_birth}</Typography>
              </Box>
            </Stack>

            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                const s = viewingStudent;
                setViewingStudent(null);
                handleOpenEdit(s);
              }}
            >
              Edit Profile details
            </Button>
          </Stack>
        )}
      </Drawer>

      {/* Creation / Editing Modal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          {editingStudent ? 'Edit Student Profile' : 'New Admission Registration'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Section 1: Personal details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Primary Contact Email"
                      type="email"
                      fullWidth
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone Number"
                      fullWidth
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Gender"
                      fullWidth
                      error={!!errors.gender}
                      helperText={errors.gender?.message}
                      disabled={saveLoading}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Date of Birth"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth}
                      helperText={errors.date_of_birth?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              {/* Section 2: Placement Details */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                  Academic & Administrative Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="admission_no"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Admission Number"
                      fullWidth
                      error={!!errors.admission_no}
                      helperText={errors.admission_no?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="school_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Assigned School"
                      fullWidth
                      error={!!errors.school_id}
                      helperText={errors.school_id?.message}
                      disabled={saveLoading}
                    >
                      {schools.map((s: any) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Admissions Status"
                      fullWidth
                      error={!!errors.status}
                      helperText={errors.status?.message}
                      disabled={saveLoading}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saveLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saveLoading}>
              {saveLoading ? <CircularProgress size={24} /> : editingStudent ? 'Update Profile' : 'Admit Student'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
