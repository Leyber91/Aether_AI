import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeRenderer from '../code';

describe('CodeRenderer', () => {
  it('renders a code block with language and copy button', () => {
    const props = {
      inline: false,
      className: 'language-js',
      children: ['console.log("hello")']
    };
    render(<CodeRenderer {...props} />);
    expect(screen.getByText('js')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByText('console.log("hello")')).toBeInTheDocument();
  });

  it('renders inline code if inline=true', () => {
    const props = {
      inline: true,
      className: '',
      children: ['let x = 1;']
    };
    render(<CodeRenderer {...props} />);
    expect(screen.getByText('let x = 1;')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });
});
