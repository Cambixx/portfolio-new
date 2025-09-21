import { useEffect } from 'react'
import SmoothScroll from './components/SmoothScroll'
import Hero from './components/Hero'
import QuoteSection from './components/QuoteSection'
import AboutSection from './components/AboutSection'
import ExperienceSection from './components/ExperienceSection'
import SkillsSection from './components/SkillsSection'
import ProjectsSection from './components/ProjectsSection'
import ContactSection from './components/ContactSection'
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

          {/* Quote Section */}
          <QuoteSection />

          {/* About Section */}
          <AboutSection />

          {/* Experience Section */}
          <ExperienceSection />

          {/* Skills Section */}
          <SkillsSection />

          {/* Projects Section */}
          <ProjectsSection />

          {/* Contact Section */}
          <ContactSection />
        </main>
      </SmoothScroll>
    </>
  )
}

export default App