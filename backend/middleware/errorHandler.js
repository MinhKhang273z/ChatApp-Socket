/**
 * Global Error Handler Middleware
 * Xử lý tất cả các lỗi từ Express routes
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error(`[ERROR] ${status} - ${message}`);
  
  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * 404 Not Found Handler
 * Xử lý khi route không tồn tại
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      status: 404,
      message: 'Route not found',
      path: req.originalUrl
    }
  });
};
