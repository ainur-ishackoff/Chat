import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('renders learn react link', () => {
    render(<App />);
    // expect(screen.getByText(/learn react/i)).toBeInTheDocument();
  });

  test('sends a message', () => {
    render(<App />);
    const messageInput = screen.getByRole('textbox', { name: /Введите сообщение/i });
    const sendButton = screen.getByRole('button', { name: /Отправить/i });

    fireEvent.change(messageInput, { target: { value: 'Hello world!' } });
    fireEvent.click(sendButton);

    // TODO: Add assertions to check if the message is displayed in the message list
  });
});