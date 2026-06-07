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
import GradeIcon from '@mui/icons-material/Grade';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchResults } from '../../store/slices/resultSlice';
import { fetchExams } from '../../store/slices/examSlice';
import { fetchStudents } from '../../store/slices/studentSlice';
import { resultService } from '../../api/services/resultService';

// Schema for validation
const resultSchema = yup.object({
  exam_id: yup.number().required('Exam is required').typeError('Exam selection is required'),
  student_id: yup.number().required('Student is required').typeError('Student selection is required'),
  obtained_marks: yup.number().required('Marks obtained is required').min(0, 'Must be at least 0').typeError('Must be a number'),
  remarks: yup.string().nullable().optional(),
  status: yup.string().required('Status is required').oneOf(['draft', 'published']),
});

type ResultFormInputs = yup.InferType<typeof resultSchema>;

export function ResultListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Select states from slices
  const { items: results, loading: resultsLoading } = useAppSelector((state) => state.results);
  const { items: exams } = useAppSelector((state) => state.exams);
  const { items: students } = useAppSelector((state) => state.students);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saveLoading, setSaveLoading] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState('id');
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
  } = useForm<ResultFormInputs>({
    resolver: yupResolver(resultSchema),
    defaultValues: {
      exam_id: undefined,
      student_id: undefined,
      obtained_marks: 0,
      remarks: '',
      status: 'published',
    },
  });

  const watchedExamId = watch('exam_id');
  const watchedObtainedMarks = watch('obtained_marks');

  useEffect(() => {
    dispatch(fetchResults());
    dispatch(fetchExams());
    dispatch(fetchStudents());
  }, [dispatch]);

  const handleOpenCreate = () => {
    if (exams.length === 0) {
      enqueueSnackbar('Please schedule exams first before inputting results.', { variant: 'warning' });
      return;
    }
    if (students.length === 0) {
      enqueueSnackbar('Please register students first before inputting results.', { variant: 'warning' });
      return;
    }
    setEditingResult(null);
    reset({
      exam_id: exams[0]?.id || undefined,
      student_id: students[0]?.id || undefined,
      obtained_marks: 0,
      remarks: '',
      status: 'published',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (result: any) => {
    setEditingResult(result);
    reset({
      exam_id: result.exam_id,
      student_id: result.student_id,
      obtained_marks: result.obtained_marks,
      remarks: result.remarks || '',
      status: (result.status as 'draft' | 'published') || 'published',
    });
    setOpenDialog(true);
  };

  // Live Grade Preview helper
  const getGradePreview = () => {
    if (!watchedExamId || watchedObtainedMarks === undefined) return null;
    const selectedExam = exams.find((e: any) => e.id === Number(watchedExamId));
    if (!selectedExam || selectedExam.total_marks === 0) return null;

    const percentage = Math.round((watchedObtainedMarks / selectedExam.total_marks) * 100);
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return {
      percentage,
      grade,
      max: selectedExam.total_marks,
      pass: selectedExam.passing_marks,
      isPass: watchedObtainedMarks >= selectedExam.passing_marks
    };
  };

  const gradePreview = getGradePreview();

  const handleFormSubmit = async (data: ResultFormInputs) => {
    // Validate marks does not exceed total marks
    const selectedExam = exams.find((e: any) => e.id === Number(data.exam_id));
    if (selectedExam && data.obtained_marks > selectedExam.total_marks) {
      enqueueSnackbar(`Obtained marks cannot exceed exam's total marks (${selectedExam.total_marks})`, { variant: 'error' });
      return;
    }

    setSaveLoading(true);
    
    // Automatically determine letter grade
    const percentage = (data.obtained_marks / (selectedExam?.total_marks || 100)) * 100;
    let finalGrade = 'F';
    if (percentage >= 90) finalGrade = 'A+';
    else if (percentage >= 80) finalGrade = 'A';
    else if (percentage >= 70) finalGrade = 'B';
    else if (percentage >= 60) finalGrade = 'C';
    else if (percentage >= 50) finalGrade = 'D';

    const payload = {
      ...data,
      grade: finalGrade
    };

    try {
      if (editingResult) {
        await resultService.update(editingResult.id, payload);
        enqueueSnackbar('Exam result updated successfully', { variant: 'success' });
      } else {
        await resultService.create(payload);
        enqueueSnackbar('Exam result recorded successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchResults());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred while saving results.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student result?')) {
      try {
        await resultService.remove(id);
        enqueueSnackbar('Result record deleted successfully', { variant: 'success' });
        dispatch(fetchResults());
      } catch (err) {
        enqueueSnackbar('Failed to delete result', { variant: 'error' });
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ['ID', 'Exam Title', 'Student Name', 'Admission No', 'Obtained Marks', 'Total Marks', 'Grade', 'Remarks', 'Status'];
    const rows = results.map((r: any) => {
      const exam = exams.find((e: any) => e.id === r.exam_id);
      const student = students.find((s: any) => s.id === r.student_id);
      const studentName = student ? `${student.first_name} ${student.last_name}` : '';
      const studentAdm = student ? student.admission_no : '';
      return [
        r.id,
        `"${r.exam_title || (exam ? exam.title : '')}"`,
        `"${studentName}"`,
        studentAdm,
        r.obtained_marks,
        exam ? exam.total_marks : 100,
        r.grade,
        `"${r.remarks || ''}"`,
        r.status
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `results_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
  const filteredItems = results
    .filter((r: any) => {
      const exam = exams.find((e: any) => e.id === r.exam_id);
      const student = students.find((s: any) => s.id === r.student_id);
      
      const examTitle = (r.exam_title || (exam ? exam.title : '')).toLowerCase();
      const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
      const studentAdm = student ? student.admission_no.toLowerCase() : '';

      const matchesSearch = examTitle.includes(searchQuery.toLowerCase()) || 
                            studentName.includes(searchQuery.toLowerCase()) ||
                            studentAdm.includes(searchQuery.toLowerCase());
      
      const matchesExam = examFilter === 'all' || r.exam_id === Number(examFilter);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesExam && matchesStatus;
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
            Academic Performance Grades
          </Typography>
          <Typography color="text.secondary">
            Publish exam results, manage grading structures, and track student score sheets.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={results.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Record Grade
          </Button>
        </Stack>
      </Stack>

      {/* Main card datagrid */}
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
                  placeholder="Search student or exam..."
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
                  label="Filter by Exam"
                  size="small"
                  fullWidth
                  value={examFilter}
                  onChange={(e) => {
                    setExamFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Exams</MenuItem>
                  {exams.map((ex: any) => (
                    <MenuItem key={ex.id} value={String(ex.id)}>
                      {ex.title}
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
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Stack>

          {/* Table */}
          <TableContainer component={Box} sx={{ borderTop: `1px solid ${theme => theme.palette.divider}` }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => handleSort('exam_id')} sx={{ cursor: 'pointer' }}>
                    Exam Event {sortField === 'exam_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('student_id')} sx={{ cursor: 'pointer' }}>
                    Student Name {sortField === 'student_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Admission No</TableCell>
                  <TableCell>Score Obtained</TableCell>
                  <TableCell>Total Max</TableCell>
                  <TableCell>Percentage</TableCell>
                  <TableCell onClick={() => handleSort('grade')} sx={{ cursor: 'pointer' }}>
                    Grade {sortField === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultsLoading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="20%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="20%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={40} height={24} /></TableCell>
                      <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                      <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center' }}>
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
                          <GradeIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Results Recorded
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          There are no examination results logged in the system. Click below to record a student grade score.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Record First Grade
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((result: any) => {
                    const student = students.find((s: any) => s.id === result.student_id);
                    const exam = exams.find((e: any) => e.id === result.exam_id);
                    const totalMarks = exam ? exam.total_marks : 100;
                    const percentage = Math.round((result.obtained_marks / totalMarks) * 100);
                    
                    return (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {result.exam_title || (exam ? exam.title : 'Unknown Exam')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {student ? student.admission_no : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{result.obtained_marks}</TableCell>
                        <TableCell color="text.secondary">{totalMarks}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{percentage}%</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={result.grade}
                            color={result.grade === 'F' ? 'error' : 'secondary'}
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                        <TableCell>{result.remarks || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={result.status}
                            color={result.status === 'published' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Grade score">
                              <IconButton size="small" onClick={() => handleOpenEdit(result)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete record">
                              <IconButton size="small" color="error" onClick={() => handleDelete(result.id)}>
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
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} records
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
          {editingResult ? 'Edit Recorded Result' : 'Log Student Examination Result'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Controller
                name="exam_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Choose Exam Schedule Event"
                    fullWidth
                    error={!!errors.exam_id}
                    helperText={errors.exam_id?.message}
                    disabled={saveLoading}
                  >
                    {exams.map((ex: any) => (
                      <MenuItem key={ex.id} value={ex.id}>
                        {ex.title} (Max: {ex.total_marks} Marks)
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

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
                name="obtained_marks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marks Obtained"
                    type="number"
                    fullWidth
                    error={!!errors.obtained_marks}
                    helperText={errors.obtained_marks?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              {/* Dynamic grade and passing verification widget */}
              {gradePreview && (
                <Alert
                  severity={gradePreview.isPass ? 'success' : 'error'}
                  sx={{ borderRadius: '10px' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Score Percentage: {gradePreview.percentage}% • Auto Grade: {gradePreview.grade}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Marks: {watchedObtainedMarks} / {gradePreview.max} (Passing mark: {gradePreview.pass}) • Status: {gradePreview.isPass ? 'PASSED' : 'FAILED'}
                  </Typography>
                </Alert>
              )}

              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Remarks / Comments"
                    fullWidth
                    error={!!errors.remarks}
                    helperText={errors.remarks?.message}
                    disabled={saveLoading}
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
                    label="Publication Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    disabled={saveLoading}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
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
              {saveLoading ? <CircularProgress size={24} /> : editingResult ? 'Update Score' : 'Record Score'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
