import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EntradasPanel } from '@/components/simulador/EntradasPanel';
import { CasosEjemplo } from '@/components/simulador/CasosEjemplo';
import type { Entradas } from '@/types/api';

const iniciales: Entradas = { potencia_w: 1900, ocupantes: 3, hora: 12 };

describe('EntradasPanel', () => {
  it('muestra los tres controles con sus etiquetas y valores iniciales', () => {
    render(<EntradasPanel valoresIniciales={iniciales} onEntradas={vi.fn()} />);
    expect(screen.getByLabelText(/Potencia instantánea/, { selector: 'input[type="text"]' })).toHaveValue('1900');
    expect(screen.getByLabelText(/Ocupantes/, { selector: 'input[type="text"]' })).toHaveValue('3');
    expect(screen.getByLabelText(/Hora del día/, { selector: 'input[type="text"]' })).toHaveValue('12:00');
  });

  it('emite las entradas válidas al montar', () => {
    const onEntradas = vi.fn();
    render(<EntradasPanel valoresIniciales={iniciales} onEntradas={onEntradas} />);
    expect(onEntradas).toHaveBeenLastCalledWith(iniciales);
  });

  it('sincroniza el slider con el campo de texto', async () => {
    const user = userEvent.setup();
    render(<EntradasPanel valoresIniciales={iniciales} onEntradas={vi.fn()} />);
    const campo = screen.getByLabelText(/Potencia instantánea/, { selector: 'input[type="text"]' });
    await user.clear(campo);
    await user.type(campo, '2500');
    const slider = screen.getByRole('slider', { name: /Potencia instantánea/ });
    await waitFor(() => expect(slider).toHaveValue('2500'));
  });

  it('acepta coma decimal y HH:MM en la hora', async () => {
    const user = userEvent.setup();
    const onEntradas = vi.fn();
    render(<EntradasPanel valoresIniciales={iniciales} onEntradas={onEntradas} />);
    const hora = screen.getByLabelText(/Hora del día/, { selector: 'input[type="text"]' });
    await user.clear(hora);
    await user.type(hora, '14,5');
    await waitFor(() => expect(onEntradas).toHaveBeenLastCalledWith({ ...iniciales, hora: 14.5 }));
  });

  it('un valor fuera de rango muestra un error accesible y no emite entradas', async () => {
    const user = userEvent.setup();
    const onEntradas = vi.fn();
    render(<EntradasPanel valoresIniciales={iniciales} onEntradas={onEntradas} />);
    const campo = screen.getByLabelText(/Potencia instantánea/, { selector: 'input[type="text"]' });
    await user.clear(campo);
    await user.type(campo, '6000');
    const alerta = await screen.findByText(/entre 0 y 3000 W/);
    expect(alerta).toHaveAttribute('role', 'alert');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(onEntradas).toHaveBeenLastCalledWith(null));
    // Nunca se recorta: el texto sigue siendo lo que escribió la persona.
    expect(campo).toHaveValue('6000');
  });
});

describe('CasosEjemplo', () => {
  it('lista los 4 casos del informe y marca activo el que coincide', () => {
    render(<CasosEjemplo entradas={iniciales} onElegir={vi.fn()} />);
    const botones = screen.getAllByRole('button', { name: /Caso/ });
    expect(botones).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Caso 2/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Caso 1/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('al pulsar un caso entrega sus valores', async () => {
    const user = userEvent.setup();
    const onElegir = vi.fn();
    render(<CasosEjemplo entradas={iniciales} onElegir={onElegir} />);
    await user.click(screen.getByRole('button', { name: /Caso 4/ }));
    expect(onElegir).toHaveBeenCalledWith({ potencia_w: 2800, ocupantes: 1, hora: 2 });
  });
});
