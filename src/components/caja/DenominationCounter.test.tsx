import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DenominationCounter } from './DenominationCounter';
import { emptyDenominationCounts } from '../../config/denominations';

describe('DenominationCounter', () => {
  it('renders one row per configured denomination, including both the $1.000 bill and the $1.000 coin', () => {
    render(<DenominationCounter denominations={emptyDenominationCounts()} onChange={vi.fn()} />);
    const rows = screen.getAllByRole('spinbutton');
    expect(rows).toHaveLength(12);
  });

  it('calls onChange with the updated quantity when a row is edited', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DenominationCounter denominations={emptyDenominationCounts()} onChange={onChange} />);

    const firstInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(firstInput);
    await user.type(firstInput, '3');

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0]).toMatchObject({ value: 100000, kind: 'bill', quantity: 3 });
  });

  it('shows a running grand total by default', () => {
    render(
      <DenominationCounter
        denominations={[
          { value: 100000, kind: 'bill', quantity: 2 },
          { value: 1000, kind: 'coin', quantity: 5 },
        ]}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(/\$\s?205[.,]?000/)).toBeInTheDocument();
  });

  it('hides the grand total when showTotal is false', () => {
    render(
      <DenominationCounter
        denominations={[{ value: 100000, kind: 'bill', quantity: 1 }]}
        onChange={vi.fn()}
        showTotal={false}
      />
    );
    expect(screen.queryByText('Total contado')).not.toBeInTheDocument();
  });
});
