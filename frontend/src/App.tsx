import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import MusicToggle from './components/MusicToggle/MusicToggle'
import './App.css'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
      <MusicToggle />
    </BrowserRouter>
  )
}

export default App