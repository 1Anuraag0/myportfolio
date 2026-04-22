import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import GlobalLayers from './components/GlobalLayers';

import Nav from './components/Nav';
import Marquee from './components/Marquee';
import Footer from './components/Footer';

import Hero from './sections/Hero';
import About from './sections/About';
import Projects from './sections/Projects';
import Skills from './sections/Skills';
import Contact from './sections/Contact';
import GithubSection from './sections/GithubSection';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // No background color transitions needed as the entire site is black now

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      <GlobalLayers />

      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Projects />
      <GithubSection />
      <Skills />
      <Contact />
      <Footer />
    </>
  );
}
