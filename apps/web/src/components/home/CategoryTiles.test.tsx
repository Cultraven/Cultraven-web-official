import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CategoryTiles } from './CategoryTiles'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    return <img {...props} />
  },
}))

describe('CategoryTiles Component', () => {
  it('renders without crashing', () => {
    render(<CategoryTiles />)
    expect(screen.getByText('Shop by Category')).toBeDefined()
  })

  it('contains the correct responsive grid class', () => {
    render(<CategoryTiles />)
    const grid = document.querySelector('.cat-grid')
    expect(grid).toBeDefined()
    
    if (grid) {
      const styles = window.getComputedStyle(grid)
      // Since JSDOM doesn't fully support CSS Grid or media queries perfectly out of the box,
      // we check for the inline styles applied in the component.
      const inlineStyle = grid.getAttribute('style')
      expect(inlineStyle).toContain('grid-template-columns: repeat(auto-fit, minmax(180px, 320px))')
      expect(inlineStyle).toContain('justify-content: center')
    }
  })
})
