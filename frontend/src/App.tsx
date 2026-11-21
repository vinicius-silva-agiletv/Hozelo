import { Route, Routes } from 'react-router'

import { HomePage } from '@/pages/home-page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
