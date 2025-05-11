import { useEffect } from 'react'
import SmoothScroll from './components/SmoothScroll'
import Hero from './components/Hero'
import AboutSection from './components/AboutSection'
import ProjectsSection from './components/ProjectsSection'
import CustomCursor from './components/CustomCursor'
import './styles/global.scss'

function App() {
  useEffect(() => {
    document.body.style.opacity = '1'
  }, [])

  return (
    <>
      <CustomCursor />
      <SmoothScroll>
        <main className="app">
          {/* Hero Section */}
          <Hero />

          {/* About Section */}
          <AboutSection />

          {/* Projects Section */}
          <ProjectsSection />

          {/* Contact Section */}
          <section className="contact">
            <div className="container">
              <h2>Contacto</h2>
              <p>¿Tienes un proyecto en mente? ¡Hablemos!</p>
            </div>
          </section>
        </main>
      </SmoothScroll>
    </>
  )
}

export default App
