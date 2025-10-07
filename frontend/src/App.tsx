import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import './App.css'
import { HorseProvider } from './hooks/ContextHorse'

function App() {
  return (
    <HorseProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </HorseProvider>
  )
}

export default App