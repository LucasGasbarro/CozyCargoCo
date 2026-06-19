import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from '../App'

/**
 * Smoke test: the full app tree renders without throwing and shows core chrome. This catches
 * context/wiring/initial-state regressions (BasePrompt §12 "no crashes in the core loop").
 */
describe('App', () => {
  it('renders the HUD and starter content without crashing', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Cozy Cargo Co.')
    // Starting coins from a fresh game should be visible in the HUD.
    expect(html).toContain('🪙')
    // The dock hint or a town panel should render.
    expect(html.length).toBeGreaterThan(200)
  })
})
