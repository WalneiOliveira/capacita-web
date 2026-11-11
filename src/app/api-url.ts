// Em desenvolvimento (ng serve, porta 4200) a API roda em localhost:3000.
// Em produção (Railway) o front e a API ficam no mesmo servidor.
const emDesenvolvimento = typeof window !== 'undefined' && window.location.port === '4200';

export const API_URL = emDesenvolvimento ? 'http://localhost:3000' : '/api';