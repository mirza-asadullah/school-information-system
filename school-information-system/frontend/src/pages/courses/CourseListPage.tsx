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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import BookIcon from '@mui/icons-material/Book';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchSchools } from '../../store/slices/schoolSlice';
import { courseService } from '../../api/services/courseService';

// Schema for course validation
const courseSchema = yup.object({
  title: yup.string().required('Course title is required').min(3, 'Must be at least 3 characters'),
  code: yup.string().required('Course code is required').min(2, 'Must be at least 2 characters'),
  school_id: yup.number().required('School assignment is required').typeError('School assignment is required'),
  description: yup.string().nullable().optional(),
  status: yup.string().required('Status is required').oneOf(['active', 'inactive']),
  openedx_course_id: yup.string().nullable().optional(),
});

type CourseFormInputs = yup.InferType<typeof courseSchema>;

export function CourseListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Select states from slices
  const { items: courses, loading: coursesLoading } = useAppSelector((state) => state.courses);
  const { items: schools } = useAppSelector((state) => state.schools);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormInputs>({
    resolver: yupResolver(courseSchema),
    defaultValues: {
      title: '',
      code: '',
      school_id: undefined,
      description: '',
      status: 'active',
      openedx_course_id: '',
    },
  });

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleOpenCreate = () => {
    if (schools.length === 0) {
      enqueueSnackbar('Please register at least one school before adding courses.', { variant: 'warning' });
      return;
    }
    setEditingCourse(null);
    reset({
      title: '',
      code: '',
      school_id: schools[0]?.id || undefined,
      description: '',
      status: 'active',
      openedx_course_id: '',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditingCourse(course);
    reset({
      title: course.title,
      code: course.code,
      school_id: course.school_id,
      description: course.description || '',
      status: (course.status as 'active' | 'inactive') || 'active',
      openedx_course_id: course.openedx_course_id || '',
    });
    setOpenDialog(true);
  };

  const handleFormSubmit = async (data: CourseFormInputs) => {
    setSaveLoading(true);
    try {
      if (editingCourse) {
        await courseService.update(editingCourse.id, data);
        enqueueSnackbar('Course details updated successfully', { variant: 'success' });
      } else {
        await courseService.create(data);
        enqueueSnackbar('Course registered successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchCourses());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred while saving the course.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await courseService.remove(id);
        enqueueSnackbar('Course deleted successfully', { variant: 'success' });
        dispatch(fetchCourses());
      } catch (err) {
        enqueueSnackbar('Failed to delete course', { variant: 'error' });
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (courses.length === 0) return;
    const headers = ['ID', 'Code', 'Title', 'Description', 'School ID', 'Open edX Mapping ID', 'Status'];
    const rows = courses.map((c: any) => [
      c.id,
      c.code,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.school_id,
      c.openedx_course_id || '',
      c.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `courses_export_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Filter & Sort
  const filteredItems = courses
    .filter((course: any) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            course.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSchool = schoolFilter === 'all' || course.school_id === Number(schoolFilter);
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
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

  // Paginate
  const paginatedItems = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Courses Management
          </Typography>
          <Typography color="text.secondary">
            Manage educational syllabus, course codes, catalogs, and LMS mapping.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={courses.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Create Course
          </Button>
        </Stack>
      </Stack>

      {/* Grid List card */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Query Filters */}
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
                  placeholder="Search by title or code..."
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
                  <TableCell onClick={() => handleSort('code')} sx={{ cursor: 'pointer' }}>
                    Course Code {sortField === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('title')} sx={{ cursor: 'pointer' }}>
                    Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Assigned School</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Open edX LMS Mapping ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coursesLoading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
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
                            bgcolor: 'rgba(6, 182, 212, 0.08)',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BookIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Courses Found
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          There are no courses matching the filter criteria. Build your first syllabus program to start.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Create New Course
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((course: any) => {
                    const isRowSelected = selectedRows.includes(String(course.id));
                    const schoolName = schools.find((s: any) => s.id === course.school_id)?.name || 'Unknown School';
                    return (
                      <TableRow key={course.id} hover selected={isRowSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(String(course.id))}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {course.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {course.title}
                          </Typography>
                        </TableCell>
                        <TableCell>{schoolName}</TableCell>
                        <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.description || '-'}
                        </TableCell>
                        <TableCell>
                          {course.openedx_course_id ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CastForEducationIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {course.openedx_course_id}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Not connected
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={course.status}
                            color={course.status === 'active' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Course details">
                              <IconButton size="small" onClick={() => handleOpenEdit(course)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Course record">
                              <IconButton size="small" color="error" onClick={() => handleDelete(course.id)}>
                                <DeleteIcon fontSize="small" />
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
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} courses
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

      {/* Creation / Editing Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          {editingCourse ? 'Edit Course configuration' : 'Create New Course'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Course Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Course Code (e.g. MATH101)"
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    disabled={saveLoading}
                  />
                )}
              />

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

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Syllabus Description"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="openedx_course_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Open edX LMS Course Key Mapping (Optional)"
                    fullWidth
                    error={!!errors.openedx_course_id}
                    helperText={errors.openedx_course_id?.message}
                    disabled={saveLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CastForEducationIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    disabled={saveLoading}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)} disabled={saveLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saveLoading}>
              {saveLoading ? <CircularProgress size={24} /> : editingCourse ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
