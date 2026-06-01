import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorToolbar from './EditorToolbar';

const makeEditor = (overrides = {}) => {
  const run = jest.fn();
  const chain = {};
  [
    'focus', 'toggleBold', 'toggleItalic', 'toggleUnderline', 'toggleStrike',
    'toggleSuperscript', 'toggleSubscript', 'setColor', 'unsetColor', 'setHighlight',
    'unsetHighlight', 'toggleHeading', 'setTextAlign', 'toggleBulletList', 'toggleOrderedList',
    'toggleBlockquote', 'toggleCode', 'extendMarkRange', 'setLink', 'unsetLink', 'setImage',
    'insertTable', 'addColumnAfter', 'deleteColumn', 'addRowAfter', 'deleteRow', 'deleteTable',
    'undo', 'redo', 'setFontSize', 'unsetFontSize', 'setFontFamily', 'unsetFontFamily',
  ].forEach((m) => { chain[m] = () => chain; });
  chain.run = run;
  return {
    run,
    on: jest.fn(),
    off: jest.fn(),
    getAttributes: jest.fn(() => ({})),
    isActive: jest.fn(() => false),
    chain: () => chain,
    ...overrides,
  };
};

describe('EditorToolbar', () => {
  it('renders nothing without an editor', () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders controls and applies bold', () => {
    const editor = makeEditor();
    render(<EditorToolbar editor={editor} />);
    expect(screen.getByTitle('Insert table')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Bold'));
    expect(editor.run).toHaveBeenCalled();
  });

  it('changes font size and family', () => {
    const editor = makeEditor();
    render(<EditorToolbar editor={editor} />);
    fireEvent.change(screen.getByTitle('Font size'), { target: { value: '16' } });
    fireEvent.change(screen.getByTitle('Font family'), { target: { value: 'Arial, sans-serif' } });
    expect(editor.run).toHaveBeenCalled();
  });

  it('applies a link via the modal', () => {
    const editor = makeEditor();
    render(<EditorToolbar editor={editor} />);
    fireEvent.click(screen.getByTitle('Insert / edit link'));
    fireEvent.change(screen.getByPlaceholderText('example.com'), { target: { value: 'example.com' } });
    fireEvent.click(screen.getByText('Apply'));
    expect(editor.run).toHaveBeenCalled();
  });

  it('inserts an image via the modal', () => {
    const editor = makeEditor();
    render(<EditorToolbar editor={editor} />);
    fireEvent.click(screen.getByTitle('Insert image by URL'));
    fireEvent.change(screen.getByPlaceholderText('https://example.com/image.png'), {
      target: { value: 'https://x.com/a.png' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(editor.run).toHaveBeenCalled();
  });

  it('shows table controls when in a table', () => {
    const editor = makeEditor({ isActive: jest.fn((name) => name === 'table') });
    render(<EditorToolbar editor={editor} />);
    expect(screen.getByTitle('Add column')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Add row'));
    expect(editor.run).toHaveBeenCalled();
  });

  it('cleans up the transaction listener', () => {
    const editor = makeEditor();
    const { unmount } = render(<EditorToolbar editor={editor} />);
    expect(editor.on).toHaveBeenCalledWith('transaction', expect.any(Function));
    unmount();
    expect(editor.off).toHaveBeenCalledWith('transaction', expect.any(Function));
  });
});