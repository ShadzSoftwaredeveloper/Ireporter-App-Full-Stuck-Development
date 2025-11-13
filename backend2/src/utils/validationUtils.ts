import Joi from 'joi';

export const authValidation = {
  signUp: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('user', 'admin').default('user')
  }),

  signIn: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

export const incidentValidation = {
  create: Joi.object({
    type: Joi.string().valid('red-flag', 'intervention').required(),
    title: Joi.string().min(5).max(500).required(),
    description: Joi.string().min(10).required(),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
      address: Joi.string().optional()
    }).required(),
    status: Joi.string().valid('draft', 'under-investigation', 'resolved', 'rejected').default('draft')
  }),

  update: Joi.object({
    type: Joi.string().valid('red-flag', 'intervention'),
    title: Joi.string().min(5).max(500),
    description: Joi.string().min(10),
    location: Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
      address: Joi.string().optional()
    }),
    status: Joi.string().valid('draft', 'under-investigation', 'resolved', 'rejected'),
    adminComment: Joi.string().optional()
  })
};

export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    profilePicture: Joi.string().uri().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};