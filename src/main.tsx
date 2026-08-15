import { StrictMode } from 'react' // kindle-map
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/newsreader'
import './index.css'
import App from './App.tsx'

// DEV-only manual seed helpers for the isolated `kindle-map-dev` database.
// Stripped from production builds. Call from the console: __lociDevSeed() to
// create the realistic Locus/Rooms scenario, __lociDevReset() to wipe it.
if (import.meta.env.DEV) {
  void import('./utils/devSeed').then(({ devSeedLocus, devResetLocus }) => {
    Object.assign(window, { __lociDevSeed: devSeedLocus, __lociDevReset: devResetLocus });
    console.info('[Loci dev] __lociDevSeed() / __lociDevReset() available (kindle-map-dev only).');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
