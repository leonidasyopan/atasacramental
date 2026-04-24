import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionCard from './SectionCard';

function setup(props = {}) {
  const onToggle = vi.fn();
  const onClear = vi.fn();
  const utils = render(
    <SectionCard
      number={3}
      title="Apoios e Desobrigações"
      enabled={props.enabled ?? true}
      onToggle={onToggle}
      onClear={onClear}
      {...props}
    >
      <button type="button">child-button</button>
    </SectionCard>,
  );
  return { onToggle, onClear, ...utils };
}

describe('SectionCard', () => {
  it('renders the title and child content', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Apoios e Desobrigações' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'child-button' })).toBeInTheDocument();
  });

  it('applies the "disabled-section" class only when enabled=false', () => {
    const { container, rerender } = setup({ enabled: true });
    expect(container.querySelector('.card')).not.toHaveClass('disabled-section');
    rerender(
      <SectionCard number={3} title="Apoios" enabled={false} onToggle={() => {}} onClear={() => {}}>
        <div />
      </SectionCard>,
    );
    expect(container.querySelector('.card')).toHaveClass('disabled-section');
  });

  // Regression guard: the bug was that the entire card had pointer-events:none
  // when disabled, blocking the "Incluir" checkbox in the header so the user
  // could never re-enable a disabled section. This test locks in the behavior
  // that toggling back on from a disabled state still fires onToggle(true).
  it('can be re-enabled from the disabled state via the Incluir checkbox', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup({ enabled: false });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('fires onToggle(false) when toggling an enabled section off', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup({ enabled: true });
    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('fires onClear when the Limpar button is clicked', async () => {
    const user = userEvent.setup();
    const { onClear } = setup();
    await user.click(screen.getByRole('button', { name: /limpar dados/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('hides the Limpar button when showClear=false', () => {
    setup({ showClear: false });
    expect(screen.queryByRole('button', { name: /limpar dados/i })).toBeNull();
  });
});
