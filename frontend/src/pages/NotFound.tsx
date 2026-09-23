import { useLocation } from 'react-router-dom'
import HeaderTop from '../components/headerTop/headerTop'
import CustomLink from '../utils/CustomLink'

const NotFound = () => {
  const location = useLocation();

  return (
    <div>
      <HeaderTop />
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>Página não encontrada</h1>
        <p style={{ color: '#5d5d5d', marginBottom: 24 }}>
          Nada responde por <code>{location.pathname}</code>.
        </p>
        <CustomLink to="/" title="Voltar para a home" className="headerLink" />
      </div>
    </div>
  )
}

export default NotFound
