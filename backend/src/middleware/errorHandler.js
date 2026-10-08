function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err.message);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds maximum limit of 30MB.' });
    }
    return res.status(400).json({ error: `Upload Error: ${err.message}` });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  // Never expose internal stack traces or database errors to client
  res.status(statusCode).json({
    error: err.message || 'An unexpected internal error occurred. Please try again.'
  });
}

module.exports = errorHandler;
