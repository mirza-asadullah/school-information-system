import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import BookIcon from '@mui/icons-material/Book';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GradeIcon from '@mui/icons-material/Grade';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import React from 'react';

export const ROUTES = {
  dashboard: '/dashboard',
  schools: '/schools',
  students: '/students',
  courses: '/courses',
  enrollments: '/enrollments',
  attendance: '/attendance',
  exams: '/exams',
  results: '/results',
  openedx: '/openedx',
  openeducat: '/openeducat',
  settings: '/settings',
  profile: '/profile',
};

export interface NavigationItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

export interface NavigationGroup {
  groupName: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    groupName: 'Academic Management',
    items: [
      { title: 'Dashboard', path: ROUTES.dashboard, icon: <DashboardIcon /> },
      { title: 'Schools', path: ROUTES.schools, icon: <SchoolIcon /> },
      { title: 'Students', path: ROUTES.students, icon: <GroupIcon /> },
      { title: 'Courses', path: ROUTES.courses, icon: <BookIcon /> },
      { title: 'Enrollments', path: ROUTES.enrollments, icon: <AssignmentIndIcon /> },
      { title: 'Attendance', path: ROUTES.attendance, icon: <FactCheckIcon /> },
      { title: 'Exams', path: ROUTES.exams, icon: <AssessmentIcon /> },
      { title: 'Results', path: ROUTES.results, icon: <GradeIcon /> },
    ],
  },
  {
    groupName: 'Integrations',
    items: [
      { title: 'OpenEduCat', path: ROUTES.openeducat, icon: <CloudSyncIcon /> },
      { title: 'Open edX', path: ROUTES.openedx, icon: <CastForEducationIcon /> },
    ],
  },
  {
    groupName: 'System',
    items: [
      { title: 'Settings', path: ROUTES.settings, icon: <SettingsIcon /> },
      { title: 'Profile', path: ROUTES.profile, icon: <AccountCircleIcon /> },
    ],
  },
];
