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
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchExams } from '../../store/slices/examSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchSchools } from '../../store/slices/schoolSlice';
import { examService } from '../../api/services/examService';

// Schema for exam validations
const examSchema = yup.object({
  title: yup.string().required('Exam title is required').min(3, 'Must be at least 3 characters'),
  exam_type: yup.string().required('Exam type is required').oneOf(['Final', 'Midterm', 'Quiz', 'Practical']),
  school_id: yup.number().required('School assignment is required').typeError('School assignment is required'),
  course_id: yup.number().required('Course is required').typeError('Course is required'),
  total_marks: yup.number().required('Total marks is required').min(1, 'Must be greater than 0').typeError('Must be a number'),
  passing_marks: yup.number().required('Passing marks is required').min(1, 'Must be greater than 0')
    .test('less-than-total', 'Passing marks cannot exceed total marks', function(value) {
      return value <= this.parent.total_marks;
    })
    .typeError('Must be a number'),
  exam_date: yup.string().required('Exam date is required'),
  status: yup.string().required('Status is required').oneOf(['scheduled', 'ongoing', 'completed', 'cancelled']),
  description: yup.string().nullable().optional(),
});

type ExamFormInputs = yup.InferType<typeof examSchema>;

export function ExamListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Select states from slices
  const { items: exams, loading: examsLoading } = useAppSelector((state) => state.exams);
  const { items: courses } = useAppSelector((state) => state.courses);
  const { items: schools } = useAppSelector((state) => state.schools);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saveLoading, setSaveLoading] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState('exam_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExamFormInputs>({
    resolver: yupResolver(examSchema),
    defaultValues: {
      title: '',
      exam_type: 'Final',
      school_id: undefined,
      course_id: undefined,
      total_marks: 100,
      passing_marks: 40,
      exam_date: '',
      status: 'scheduled',
      description: '',
    },
  });

  const watchedSchoolId = watch('school_id');

  useEffect(() => {
    dispatch(fetchExams());
    dispatch(fetchCourses());
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleOpenCreate = () => {
    if (schools.length === 0) {
      enqueueSnackbar('Please register at least one school before scheduling exams.', { variant: 'warning' });
      return;
    }
    if (courses.length === 0) {
      enqueueSnackbar('Please register at least one course before scheduling exams.', { variant: 'warning' });
      return;
    }
    setEditingExam(null);
    reset({
      title: '',
      exam_type: 'Final',
      school_id: schools[0]?.id || undefined,
      course_id: courses[0]?.id || undefined,
      total_marks: 100,
      passing_marks: 40,
      exam_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      description: '',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (exam: any) => {
    setEditingExam(exam);
    reset({
      title: exam.title,
      exam_type: (exam.exam_type as 'Final' | 'Midterm' | 'Quiz' | 'Practical') || 'Final',
      school_id: exam.school_id,
      course_id: exam.course_id,
      total_marks: exam.total_marks,
      passing_marks: exam.passing_marks,
      exam_date: exam.exam_date || '',
      status: (exam.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled') || 'scheduled',
      description: exam.description || '',
    });
    setOpenDialog(true);
  };

  const handleFormSubmit = async (data: ExamFormInputs) => {
    setSaveLoading(true);
    try {
      if (editingExam) {
        await examService.update(editingExam.id, data);
        enqueueSnackbar('Exam scheduled updated successfully', { variant: 'success' });
      } else {
        await examService.create(data);
        enqueueSnackbar('Exam scheduled successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchExams());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred while scheduling the exam.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel/delete this exam schedule?')) {
      try {
        await examService.remove(id);
        enqueueSnackbar('Exam schedule deleted successfully', { variant: 'success' });
        dispatch(fetchExams());
      } catch (err) {
        enqueueSnackbar('Failed to delete exam', { variant: 'error' });
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (exams.length === 0) return;
    const headers = ['ID', 'Title', 'Type', 'Course Code', 'School ID', 'Date', 'Total Marks', 'Passing Marks', 'Status'];
    const rows = exams.map((e: any) => {
      const course = courses.find((c: any) => c.id === e.course_id);
      return [
        e.id,
        `"${e.title.replace(/"/g, '""')}"`,
        e.exam_type,
        course ? course.code : '',
        e.school_id,
        e.exam_date || '',
        e.total_marks,
        e.passing_marks,
        e.status
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `exams_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filters
  const filteredItems = exams
    .filter((e: any) => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = courseFilter === 'all' || e.course_id === Number(courseFilter);
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesCourse && matchesStatus;
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

  const paginatedItems = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Available courses based on selected school in Create/Edit form
  const availableCourses = courses.filter((c: any) => c.school_id === Number(watchedSchoolId));

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Academic Examinations
          </Typography>
          <Typography color="text.secondary">
            Schedule midterms, quizzes, finals, practical tests and log academic dates.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={exams.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Schedule Exam
          </Button>
        </Stack>
      </Stack>

      {/* Main card panel */}
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
                  placeholder="Search exam title..."
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
                  label="Filter by Course"
                  size="small"
                  fullWidth
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {courses.map((c: any) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.code} - {c.title}
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
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>

          {/* Table */}
          <TableContainer component={Box} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('title')} sx={{ cursor: 'pointer' }}>
                    Exam Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Exam Type</TableCell>
                  <TableCell>Course Name</TableCell>
                  <TableCell onClick={() => handleSort('exam_date')} sx={{ cursor: 'pointer' }}>
                    Exam Date {sortField === 'exam_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Total Marks</TableCell>
                  <TableCell>Passing Marks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {examsLoading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="30%" /></TableCell>
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
                            bgcolor: 'rgba(245, 158, 11, 0.08)',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AssessmentIcon sx={{ fontSize: 48, color: 'warning.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Exams Scheduled
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          There are no examination events scheduled. Click below to schedule a midterm or final quiz.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Schedule First Exam
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((exam: any) => {
                    const course = courses.find((c: any) => c.id === exam.course_id);
                    return (
                      <TableRow key={exam.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {exam.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={exam.exam_type} />
                        </TableCell>
                        <TableCell>
                          {course ? `${course.code} - ${course.title}` : 'Unknown Course'}
                        </TableCell>
                        <TableCell>{exam.exam_date || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{exam.total_marks}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{exam.passing_marks}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={exam.status}
                            color={
                              exam.status === 'completed'
                                ? 'success'
                                : exam.status === 'ongoing'
                                  ? 'primary'
                                  : exam.status === 'cancelled'
                                    ? 'error'
                                    : 'warning'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Exam details">
                              <IconButton size="small" onClick={() => handleOpenEdit(exam)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Exam schedule">
                              <IconButton size="small" color="error" onClick={() => handleDelete(exam.id)}>
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
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} exams
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

      {/* Creation / Editing Modal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          {editingExam ? 'Edit Scheduled Exam' : 'Schedule New Exam'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Exam Title"
                      fullWidth
                      error={!!errors.title}
                      helperText={errors.title?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="exam_type"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Exam Type"
                      fullWidth
                      error={!!errors.exam_type}
                      helperText={errors.exam_type?.message}
                      disabled={saveLoading}
                    >
                      <MenuItem value="Final">Final Exam</MenuItem>
                      <MenuItem value="Midterm">Midterm Exam</MenuItem>
                      <MenuItem value="Quiz">Short Quiz</MenuItem>
                      <MenuItem value="Practical">Practical / Lab</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <Controller
                  name="course_id"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Course Class"
                      fullWidth
                      error={!!errors.course_id}
                      helperText={errors.course_id?.message}
                      disabled={saveLoading || !watchedSchoolId}
                    >
                      {availableCourses.map((c: any) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.code} - {c.title}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="total_marks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Total Marks"
                      type="number"
                      fullWidth
                      error={!!errors.total_marks}
                      helperText={errors.total_marks?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="passing_marks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Passing Marks"
                      type="number"
                      fullWidth
                      error={!!errors.passing_marks}
                      helperText={errors.passing_marks?.message}
                      disabled={saveLoading}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Controller
                  name="exam_date"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Exam Date"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.exam_date}
                      helperText={errors.exam_date?.message}
                      disabled={saveLoading}
                    />
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
                      label="Status"
                      fullWidth
                      error={!!errors.status}
                      helperText={errors.status?.message}
                      disabled={saveLoading}
                    >
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="ongoing">Ongoing</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Instructions / Description"
                      fullWidth
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      disabled={saveLoading}
                    />
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
              {saveLoading ? <CircularProgress size={24} /> : editingExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
