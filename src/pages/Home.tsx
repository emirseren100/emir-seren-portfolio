import { useEffect } from 'react';
import { site } from '../content/site';
import { About } from '../sections/about/About';
import { Contact } from '../sections/contact/Contact';
import { Hero } from '../sections/hero/Hero';
import { Playground } from '../sections/playground/Playground';
import { Practice } from '../sections/practice/Practice';
import { Toolkit } from '../sections/toolkit/Toolkit';
import { Work } from '../sections/work/Work';

export default function Home() {
  useEffect(() => {
    document.title = `${site.name} — ${site.role}`;
  }, []);
  return (
    <>
      <Hero />
      <Practice />
      <Work />
      <About />
      <Toolkit />
      <Playground />
      <Contact />
    </>
  );
}
