/**
 * Validation middleware functions
 */

/**
 * Validate Ethereum wallet address format
 */
const validateWalletAddress = (address) => {
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(email);
};

/**
 * Validate transaction hash format
 */
const validateTransactionHash = (hash) => {
  const regex = /^0x[a-fA-F0-9]{64}$/;
  return regex.test(hash);
};

/**
 * Validate price format (max 2 decimal places)
 */
const validatePrice = (price) => {
  const regex = /^\d+(\.\d{1,2})?$/;
  return regex.test(price.toString());
};

/**
 * Validate date is in the future
 */
const validateFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    fields.forEach(field => {
      if (!req.body[field]) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            missing
          }
        }
      });
    }

    next();
  };
};

/**
 * Validate event creation data
 */
const validateEventData = (req, res, next) => {
  const { title, description, dateTime, duration, price, maxAttendees } = req.body;
  const errors = {};

  // Title validation
  if (!title || title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (title.trim().length > 200) {
    errors.title = 'Title cannot exceed 200 characters';
  }

  // Description validation
  if (!description || description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  } else if (description.trim().length > 5000) {
    errors.description = 'Description cannot exceed 5000 characters';
  }

  // DateTime validation
  if (!dateTime) {
    errors.dateTime = 'Event date and time is required';
  } else if (!validateFutureDate(dateTime)) {
    errors.dateTime = 'Event date must be in the future';
  }

  // Duration validation
  const durationNum = Number(duration);
  if (!duration || isNaN(durationNum)) {
    errors.duration = 'Duration is required and must be a number';
  } else if (durationNum < 15) {
    errors.duration = 'Duration must be at least 15 minutes';
  } else if (durationNum > 1440) {
    errors.duration = 'Duration cannot exceed 24 hours';
  }

  // Price validation
  const priceNum = Number(price);
  if (price === undefined || price === null || isNaN(priceNum)) {
    errors.price = 'Price is required and must be a number';
  } else if (priceNum < 0) {
    errors.price = 'Price cannot be negative';
  } else if (!validatePrice(priceNum)) {
    errors.price = 'Price can have maximum 2 decimal places';
  }

  // MaxAttendees validation
  const maxAttendeesNum = Number(maxAttendees);
  if (!maxAttendees || isNaN(maxAttendeesNum)) {
    errors.maxAttendees = 'Maximum attendees is required and must be a number';
  } else if (maxAttendeesNum < 1) {
    errors.maxAttendees = 'Must allow at least 1 attendee';
  } else if (maxAttendeesNum > 10000) {
    errors.maxAttendees = 'Cannot exceed 10,000 attendees';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          fields: errors
        }
      }
    });
  }

  next();
};

module.exports = {
  validateWalletAddress,
  validateEmail,
  validateTransactionHash,
  validatePrice,
  validateFutureDate,
  validateRequiredFields,
  validateEventData
};

