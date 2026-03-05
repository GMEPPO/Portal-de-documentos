import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { SearchPage } from './pages/SearchPage'
import { DocDetailPage } from './pages/DocDetailPage'
import { ProcessesPage } from './pages/ProcessesPage'
import { ProcessDetailPage } from './pages/ProcessDetailPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/docs/:id" element={<DocDetailPage />} />
        <Route path="/processes" element={<ProcessesPage />} />
        <Route path="/processes/:processName" element={<ProcessDetailPage />} />
      </Routes>
    </Layout>
  )
}

export default App
