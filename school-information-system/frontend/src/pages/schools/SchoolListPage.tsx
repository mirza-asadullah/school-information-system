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
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  MenuItem,
  Checkbox,
  InputAdornment,
  Menu,
  Skeleton,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SchoolIcon from '@mui/icons-material/School';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchSchools } from '../../store/slices/schoolSlice';
import { schoolService } from '../../api/services/schoolService';

// Schema for school validation
const schoolSchema = yup.object({
  name: yup.string().required('School name is required').min(3, 'Must be at least 3 characters'),
  email: yup.string().required('Email is required').email('Must be a valid email'),
  phone: yup.string().nullable().optional(),
  address: yup.string().nullable().optional(),
  status: yup.string().required('Status is required').oneOf(['active', 'inactive']),
});

type SchoolFormInputs = yup.InferType<typeof schoolSchema>;

export function SchoolListPage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { items, loading } = useAppSelector((state) => state.schools);

  // States
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Table Sorting
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchoolFormInputs>({
    resolver: yupResolver(schoolSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    },
  });

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleOpenCreate = () => {
    setEditingSchool(null);
    reset({
      name: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (school: any) => {
    setEditingSchool(school);
    reset({
      name: school.name,
      email: school.email,
      phone: school.phone || '',
      address: school.address || '',
      status: school.status as 'active' | 'inactive',
    });
    setOpenDialog(true);
  };

  const handleFormSubmit = async (data: SchoolFormInputs) => {
    setSaveLoading(true);
    try {
      if (editingSchool) {
        await schoolService.update(editingSchool.id, data);
        enqueueSnackbar('School updated successfully', { variant: 'success' });
      } else {
        await schoolService.create(data);
        enqueueSnackbar('School registered successfully', { variant: 'success' });
      }
      setOpenDialog(false);
      dispatch(fetchSchools());
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'An error occurred while saving the school.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      try {
        await schoolService.remove(id);
        enqueueSnackbar('School deleted successfully', { variant: 'success' });
        dispatch(fetchSchools());
      } catch (err) {
        enqueueSnackbar('Failed to delete school', { variant: 'error' });
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the ${selectedRows.length} selected schools?`)) {
      try {
        await Promise.all(selectedRows.map(id => schoolService.remove(id)));
        enqueueSnackbar('Selected schools deleted successfully', { variant: 'success' });
        setSelectedRows([]);
        dispatch(fetchSchools());
      } catch (err) {
        enqueueSnackbar('Failed to delete some schools', { variant: 'error' });
      }
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Status'];
    const rows = items.map((s: any) => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.email,
      s.phone || '',
      `"${(s.address || '').replace(/"/g, '""')}"`,
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `schools_export_${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Filters & Sorting logic over items
  const filteredItems = items
    .filter((school: any) => {
      const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            school.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
      return matchesSearch && matchesStatus;
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

  // Paginated Rows
  const paginatedItems = filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            School Management
          </Typography>
          <Typography color="text.secondary">
            Manage academic institutions, locations, statuses, and profiles.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            disabled={items.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Register School
          </Button>
        </Stack>
      </Stack>

      {/* Main Container Card */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {/* Filters & Actions Panel */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
            sx={{ p: 2.5 }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Search by name or email..."
                size="small"
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
                sx={{ width: { xs: '100%', sm: 280 } }}
              />

              <TextField
                select
                label="Status Filter"
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ width: { xs: '100%', sm: 160 } }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Stack>

            {/* Bulk actions */}
            {selectedRows.length > 0 && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', px: 2, py: 1, borderRadius: '8px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedRows.length} item(s) selected
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={handleBulkDelete}
                  startIcon={<DeleteIcon />}
                  sx={{ py: 0.5, borderRadius: '6px' }}
                >
                  Delete Selected
                </Button>
              </Stack>
            )}
          </Stack>

          {/* Data Table */}
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
                  <TableCell onClick={() => handleSort('name')} sx={{ cursor: 'pointer' }}>
                    School Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell onClick={() => handleSort('email')} sx={{ cursor: 'pointer' }}>
                    Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer' }}>
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from(new Array(5)).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="90%" /></TableCell>
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
                            bgcolor: 'rgba(37, 99, 235, 0.08)',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <SchoolIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          No Schools Found
                        </Typography>
                        <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                          There are no academic institutions matching the filters. Create your first school config to start.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleOpenCreate}
                          sx={{ mt: 1 }}
                        >
                          Create your first school
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((school: any) => {
                    const isRowSelected = selectedRows.includes(String(school.id));
                    return (
                      <TableRow key={school.id} hover selected={isRowSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(String(school.id))}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {school.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>{school.phone || '-'}</TableCell>
                        <TableCell>{school.address || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={school.status}
                            color={school.status === 'active' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit details">
                              <IconButton size="small" onClick={() => handleOpenEdit(school)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete record">
                              <IconButton size="small" color="error" onClick={() => handleDelete(school.id)}>
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

          {/* Simple Pagination Footer Controls */}
          {filteredItems.length > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredItems.length)} of {filteredItems.length} institutions
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
          {editingSchool ? 'Edit School Configuration' : 'Register New School'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="School Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={saveLoading}
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Academic Contact Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={saveLoading}
                  />
                )}
              />

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

              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Physical Address"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.address}
                    helperText={errors.address?.message}
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
                    label="Account Status"
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
              {saveLoading ? <CircularProgress size={24} /> : editingSchool ? 'Save Changes' : 'Register Institution'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
