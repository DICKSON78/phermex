import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProductsPage from './pages/ProductsPage'
import CareersPage from './pages/CareersPage'
import NewsroomPage from './pages/NewsroomPage'
import ArticlePage from './pages/ArticlePage'
import FAQPage from './pages/FAQPage'
import ApplyPage from './pages/ApplyPage'
import ContactPage from './pages/ContactPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="pt-[72px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/newsroom" element={<NewsroomPage />} />
          <Route path="/newsroom/:slug" element={<ArticlePage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
