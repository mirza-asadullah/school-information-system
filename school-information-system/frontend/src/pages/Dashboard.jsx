import { Box, Container, Typography } from '@mui/material'

export function DashboardPage() {
  return (
    <Container sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Welcome to the School Information System. Use the navigation panel to manage students, courses, enrollments, syllabi, videos, and progress.
      </Typography>
    </Container>
  )
}
