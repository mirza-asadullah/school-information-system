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
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEnrollments } from '../../store/slices/enrollmentSlice';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { enrollmentService } from '../../api/services/enrollmentService';

// Schema for enrollment validations
const enrollmentSchema = yup.object({
  student_id: yup.number().required('Student selection is required').typeError('Student selection is required'),
  course_id: yup.number().required('Course selection is required').typeError('Course selection is required'),
  status: yup.string().required('Status is required').oneOf(['active', 'completed', 'dropped']),
});

type EnrollmentFormInputs = yup.InferType<typeof enrollmentSchema>;

export function EnrollmentListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Select states from slices
  const { items: enrollments, loading: enrollmentsLoading } = useAppSelector((state) => state.enrollments);
  const { items: students } = useAppSelector((state) => state.students);
  const { items: courses } = useAppSelector((state) => state.courses);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saveLoading, setSaveLoading] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState('enrolled_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnrollmentFormInputs>({
    resolver: yupResolver(enrollmentSchema),
    defaultValues: {
      student_id: undefined,
      course_id: undefined,
      status: 'active',
    },
  });

  useEffect(() => {
    dispatch(fetchEnrollments());
    dispatch(fetchStudents());
    dispatch(fetchCourses());
  }, [dispatch]);

  const handleOpenCreate = () => {
    if (students.length === 0) {
      enqueueSnackbar('Please register students first before making enrollments.', { variant: 'warning' });
      return;
    }
    if (courses.length === 0) {
      enqueueSnackbar('Please register courses first before making enrollments.', { variant: 'warning' });
      return;
    }
    setEditingEnrollment(null);
    reset({
      student_id: students[0]?.id || undefined,
      course_id: courses[0]?.id || undefined,
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (enrollment: any) => {
    setEditingEnrollment(enrollment);
    reset({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      status: (enrollment.status as 'active' | 'completed' | 'dropped') || 'active',
    });
    setOpenDialog(true);
  };

  const handleFormSubmit = async (data: EnrollmentFormInputs) => {
    setSaveLoading(true);
    try {
      if (editingEnrollment) {
        await enrollmentService.update(editingEnrollment.id, data);
        enqueueSnackbar('Enrollment status updated successfully', { variant: 'success' });
      } else {
        await enrollmentService.create(data);
        enqueueSnackbar('Student enrolled successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchEnrollments());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred during enrollment.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel/delete this enrollment?')) {
      try {
        await enrollmentService.remove(id);
        enqueueSnackbar('Enrollment cancelled successfully', { variant: 'success' });
        dispatch(fetchEnrollments());
      } catch (err) {
        enqueueSnackbar('Failed to delete enrollment', { variant: 'error' });
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (enrollments.length === 0) return;
    const headers = ['ID', 'Student Name', 'Admission No', 'Course Title', 'Course Code', 'Enrolled At', 'Status'];
    const rows = enrollments.map((e: any) => {
      const student = students.find((s: any) => s.id === e.student_id);
      const studentName = student ? `${student.first_name} ${student.last_name}` : 'Unknown';
      const studentAdm = student ? student.admission_no : '';
      const course = courses.find((c: any) => c.id === e.course_id);
      const courseTitle = course ? course.title : 'Unknown';
      const courseCode = course ? course.code : '';
      return [
        e.id,
        `"${studentName}"`,
        studentAdm,
        `"${courseTitle}"`,
        courseCode,
        e.enrolled_at || '',
        e.status
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enrollments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filter & Sort
  const filteredItems = enrollments
    .filter((e: any) => {
      const student = students.find((s: any) => s.id === e.student_id);
      const course = courses.find((c: any) => c.id === e.course_id);
      const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
      const studentAdm = student ? student.admission_no.toLowerCase() : '';
      const courseTitle = course ? course.title.toLowerCase() : '';
      
      const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                            studentAdm.includes(searchQuery.toLowerCase()) ||
                            courseTitle.includes(searchQuery.toLowerCase());
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

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Course Enrollments
          </Typography>
          <Typography color="text.secondary">
            Enroll students into syllabus courses, track enrollment history, and status updates.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={enrollments.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Enroll Student
          </Button>
        </Stack>
      </Stack>

      {/* Grid container card */}
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
                  placeholder="Search by student or course..."
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="dropped">Dropped</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>

          {/* Table */}
          <TableContainer component={Box} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('student_id')} sx={{ cursor: 'pointer' }}>
                    Student Name {sortField === 'student_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Admission No</TableCell>
                  <TableCell onClick={() => handleSort('course_id')} sx={{ cursor: 'pointer' }}>
                    Course Title {sortField === 'course_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Course Code</TableCell>
                  <TableCell onClick={() => handleSort('enrolled_at')} sx={{ cursor: 'pointer' }}>
                    Enrolled Date {sortField === 'enrolled_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollmentsLoading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center' }}>
                      <Stack spacing={2} alignItems="center" justifyContent="center">
                        <Box
                          sx={{
                            bgcolor: 'rgba(236, 72, 153, 0.08)',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AssignmentIndIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Enrollments Found
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          No active class course enrollments registered. Click below to register your first student.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Enroll a Student
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((enrollment: any) => {
                    const student = students.find((s: any) => s.id === enrollment.student_id);
                    const course = courses.find((c: any) => c.id === enrollment.course_id);
                    const formattedDate = enrollment.enrolled_at 
                      ? new Date(enrollment.enrolled_at).toLocaleDateString()
                      : '-';
                    return (
                      <TableRow key={enrollment.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student ? student.email : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {student ? student.admission_no : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {course ? course.title : 'Unknown Course'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {course ? course.code : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={enrollment.status}
                            color={
                              enrollment.status === 'active' 
                                ? 'success' 
                                : enrollment.status === 'completed' 
                                  ? 'primary' 
                                  : 'error'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Update Status">
                              <IconButton size="small" onClick={() => handleOpenEdit(enrollment)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel Enrollment">
                              <IconButton size="small" color="error" onClick={() => handleDelete(enrollment.id)}>
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
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} enrollments
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
          {editingEnrollment ? 'Change Enrollment Status' : 'Enroll Student in Course'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              {editingEnrollment ? (
                // If editing, display read-only labels for Student/Course and only show status dropdown
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Student Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {(() => {
                        const student = students.find((s: any) => s.id === editingEnrollment.student_id);
                        return student ? `${student.first_name} ${student.last_name} (${student.admission_no})` : 'Unknown';
                      })()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Selected Course
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {(() => {
                        const course = courses.find((c: any) => c.id === editingEnrollment.course_id);
                        return course ? `${course.code} - ${course.title}` : 'Unknown';
                      })()}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                // If registering, show search selectors
                <>
                  <Controller
                    name="student_id"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Select Student Profile"
                        fullWidth
                        error={!!errors.student_id}
                        helperText={errors.student_id?.message}
                        disabled={saveLoading}
                      >
                        {students.map((s: any) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.first_name} {s.last_name} ({s.admission_no})
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />

                  <Controller
                    name="course_id"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Choose Academic Course"
                        fullWidth
                        error={!!errors.course_id}
                        helperText={errors.course_id?.message}
                        disabled={saveLoading}
                      >
                        {courses.map((c: any) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.code} - {c.title}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </>
              )}

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Enrollment Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    disabled={saveLoading}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="dropped">Dropped</MenuItem>
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
              {saveLoading ? <CircularProgress size={24} /> : editingEnrollment ? 'Save Status' : 'Enroll Student'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
