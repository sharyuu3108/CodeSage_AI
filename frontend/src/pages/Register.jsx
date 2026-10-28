import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Password rules validation for user visual guidance
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber) {
      setFormError('Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(formData);
      success(`Welcome to CodeSage AI, ${user.username}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create your CodeSage account</h1>
          <p className="auth-subtitle">Get started with AI-powered code analysis and optimization</p>
        </div>

        {formError && (
          <div className="auth-alert auth-alert-error" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Linus Torvalds"
              required
              autoComplete="name"
              disabled={submitting}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. ltorvalds"
              required
              autoComplete="username"
              disabled={submitting}
              className="form-input"
            />
            <span className="form-hint">Alphanumeric, underscores, and dashes only</span>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="developer@example.com"
              required
              autoComplete="email"
              disabled={submitting}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
              disabled={submitting}
            />

            {/* Password Criteria Checklist */}
            <div className="password-criteria" aria-label="Password requirements">
              <div className={`criteria-item ${hasMinLength ? 'met' : ''}`}>
                <span className="criteria-bullet" aria-hidden="true" />
                <span>At least 8 characters</span>
              </div>
              <div className={`criteria-item ${hasUppercase && hasLowercase ? 'met' : ''}`}>
                <span className="criteria-bullet" aria-hidden="true" />
                <span>Uppercase & lowercase letters</span>
              </div>
              <div className={`criteria-item ${hasNumber ? 'met' : ''}`}>
                <span className="criteria-bullet" aria-hidden="true" />
                <span>At least one number</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
              disabled={submitting}
            />
            {formData.confirmPassword && (
              <span className={`form-hint ${passwordsMatch ? 'text-success' : 'text-danger'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
