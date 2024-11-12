import { render, screen } from '@testing-library/react';
import App from './App';
import { API_BASE_URL } from './constants';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Login/i);
  expect(linkElement).toBeInTheDocument();
});

test('Checks Server API URL is production URL', () => {
  expect( API_BASE_URL).toEqual("https://api.production.coastalpowder.upstreamtech.dev/api");
});
