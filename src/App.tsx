import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import GlobalLayers from './components/GlobalLayers';
import Cursor from './components/Cursor';
import Nav from './components/Nav';
import Marquee from './components/Marquee';
import Footer from './components/Footer';

import Hero from './sections/Hero';
import About from './sections/About';
import Projects from './sections/Projects';
import GithubGardenSection from './sections/GithubGardenSection';
import Skills from './sections/Skills';
import Contact from './sections/Contact';

gsap.registerPlugin(ScrollTrigger);

const BG_COLORS = [
  '#07030F', // hero
  '#180910', // about
  '#0D0520', // projects
  '#0A0A0F', // garden
  '#130728', // skills
  '#180910', // contact
];

const SECTION_IDS = ['#hero', '#about', '#projects', '#garden', '#skills', '#contact'];

export default function App() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    SECTION_IDS.forEach((sel, i) => {
      ScrollTrigger.create({
        trigger: sel,
        start: 'top center',
        onEnter: () =>
          gsap.to('body', {
            backgroundColor: BG_COLORS[i],
            duration: 0.8,
            ease: 'power2.inOut',
          }),
        onEnterBack: () =>
          gsap.to('body', {
            backgroundColor: BG_COLORS[i],
            duration: 0.8,
            ease: 'power2.inOut',
          }),
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <>
      <GlobalLayers />
      <Cursor />
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Projects />
      <GithubGardenSection />
      <Skills />
      <Contact />
      <Footer />
    </>
  );
}
