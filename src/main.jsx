import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// depois do App de propósito: os componentes do React Bits trazem o próprio
// CSS, e o global.css precisa vir por último pra poder ajustá-los
import './styles/global.css';

/* Sem <StrictMode>: em desenvolvimento ele monta cada efeito duas vezes, e
   os componentes WebGL do React Bits (Aurora, GhostFibers, SpecularButton)
   devolvem o contexto da GPU ao desmontar — na segunda montagem o canvas
   já não teria contexto e ficaria em branco. */
createRoot(document.getElementById('root')).render(<App />);
