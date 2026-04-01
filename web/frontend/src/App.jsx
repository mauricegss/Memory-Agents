import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Configurator from './pages/Configurator';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <h1>Jogo da Memória Edu!</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Configurator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
