import { Box, Container, Paper } from '@mui/material'

export function AuthLayout({ children }) {
  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 10, p: 4 }}>{children}</Paper>
    </Container>
  )
}
