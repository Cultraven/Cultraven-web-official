import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CategoryTiles } from './CategoryTiles'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { fill, ...rest } = props;
    return <img {...rest} data-fill={fill ? "true" : "false"} />
  },
}))

describe('CategoryTiles Component', () => {
  it('renders without crashing', () => {
    render(<CategoryTiles />)
    expect(screen.getByText('THE SHOP')).toBeDefined()
  })

  it('contains the correct responsive grid class', () => {
    render(<CategoryTiles />)
    const grid = document.querySelector('.bento-grid')
    expect(grid).toBeDefined()
    
    if (grid) {
      const inlineStyle = grid.getAttribute('style')
      expect(inlineStyle).toContain('display: grid')
    }
  })
})
