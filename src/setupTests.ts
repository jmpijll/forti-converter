import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to global scope for testing
global.TextEncoder = TextEncoder;

// Mock TextDecoder for tests
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
} 