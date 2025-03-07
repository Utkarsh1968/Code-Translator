import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { name: 'Python', value: 'Python', icon: '🐍' },
  { name: 'JavaScript', value: 'JavaScript', icon: '📜' },
  { name: 'Java', value: 'Java', icon: '☕' },
  { name: 'C++', value: 'C++', icon: '⚡' },
  { name: 'C#', value: 'C#', icon: '💻' }
];


export const DEFAULT_SOURCE_CODE = `# Enter your code here
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))`;
