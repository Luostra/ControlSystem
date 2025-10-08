const { register, login, getMe } = require('../controllers/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Мокаем все зависимости перед импортом тестируемого модуля
jest.mock('../db', () => ({
  query: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

jest.mock('dotenv', () => ({ 
  config: jest.fn() 
}));

const pool = require('../db');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Сбрасываем все моки перед каждым тестом
    jest.clearAllMocks();

    // Создаем моки request и response
    mockReq = {
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    // Мокаем environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    // Мокаем console.error чтобы не засорять вывод тестов
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Восстанавливаем console.error после каждого теста
    console.error.mockRestore();
  });

  afterAll(() => {
    // Очищаем все моки после всех тестов
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should return 400 if username already exists', async () => {
      // Arrange
      mockReq.body = { username: 'testuser1', password: 'Password123' };
      pool.query.mockResolvedValue({ rows: [{ id: 1, username: 'testuser1' }] });

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = $1',
        ['testuser1']
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });

    it('should create new user and return token on successful registration', async () => {
      // Arrange
      mockReq.body = { username: 'newuser', password: 'password123' };
      
      // Мокаем последовательные вызовы pool.query
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Проверка существования пользователя
        .mockResolvedValueOnce({ // Создание пользователя
          rows: [{ id: 1, username: 'newuser', password: 'hashedPassword' }]
        });

      // Мокаем bcrypt
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');

      // Мокаем jwt.sign с callback
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mock-token');
      });

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: 1, username: 'newuser' } },
        'test-secret',
        { expiresIn: '1h' },
        expect.any(Function)
      );
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'mock-token' });
    });

    it('should return 500 on database error', async () => {
      // Arrange
      mockReq.body = { username: 'testuser', password: 'password123' };
      const dbError = new Error('Database connection failed');
      pool.query.mockRejectedValue(dbError);

      // Act
      await register(mockReq, mockRes);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Database connection failed');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Server error');
    });
  });

  describe('login', () => {
    it('should return 400 if user does not exist', async () => {
      // Arrange
      mockReq.body = { username: 'nonexistent', password: 'password123' };
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 400 if password is incorrect', async () => {
      // Arrange
      mockReq.body = { username: 'existinguser', password: 'wrongpassword' };
      pool.query.mockResolvedValue({
        rows: [{ id: 1, username: 'existinguser', password: 'hashedPassword' }]
      });
      bcrypt.compare.mockResolvedValue(false);

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return token on successful login', async () => {
      // Arrange
      mockReq.body = { username: 'existinguser', password: 'correctpassword' };
      pool.query.mockResolvedValue({
        rows: [{ id: 1, username: 'existinguser', password: 'hashedPassword' }]
      });
      bcrypt.compare.mockResolvedValue(true);
      
      jwt.sign.mockImplementation((payload, secret, options, callback) => {
        callback(null, 'mock-login-token');
      });

      // Act
      await login(mockReq, mockRes);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { id: 1, username: 'existinguser' } },
        'test-secret',
        { expiresIn: '1h' },
        expect.any(Function)
      );
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'mock-login-token' });
    });
  });

  describe('getMe', () => {
    it('should return user data without password', async () => {
      // Arrange
      mockReq.user = { id: 1 };
      const mockUser = {
        id: 1,
        username: 'testuser',
        created_at: '2023-01-01'
      };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      // Act
      await getMe(mockReq, mockRes);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [1]
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on database error in getMe', async () => {
      // Arrange
      mockReq.user = { id: 1 };
      const dbError = new Error('DB error');
      pool.query.mockRejectedValue(dbError);

      // Act
      await getMe(mockReq, mockRes);

      // Assert
      expect(console.error).toHaveBeenCalledWith('DB error');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith('Server error');
    });
  });
});