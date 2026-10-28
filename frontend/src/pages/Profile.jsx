import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../services/api.js';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    githubUsername: '',
    linkedinUrl: '',
    website: '',
    skills: '',
    preferredLanguages: [],
    defaultLanguage: 'python',
  });

  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch fresh profile and real statistics from server
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/profile');
      if (data?.profile) {
        setProfileData(data.profile);
        setFormData({
          name: data.profile.name || '',
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          githubUsername: data.profile.githubUsername || '',
          linkedinUrl: data.profile.linkedinUrl || '',
          website: data.profile.website || '',
          skills: (data.profile.skills || []).join(', '),
          preferredLanguages: data.profile.preferredLanguages || ['python', 'javascript'],
          defaultLanguage: data.profile.defaultLanguage || 'python',
        });
      }
    } catch (err) {
      toastError(err.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData((prev) => {
      const exists = prev.preferredLanguages.includes(lang);
      const updated = exists
        ? prev.preferredLanguages.filter((l) => l !== lang)
        : [...prev.preferredLanguages, lang];
      return { ...prev, preferredLanguages: updated };
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        githubUsername: formData.githubUsername.trim(),
        linkedinUrl: formData.linkedinUrl.trim(),
        website: formData.website.trim(),
        skills: skillsArray,
        preferredLanguages: formData.preferredLanguages,
        defaultLanguage: formData.defaultLanguage,
      };

      const res = await api.put('/api/profile', payload);
      if (res?.user) {
        updateUser(res.user);
        setProfileData((prev) => ({
          ...prev,
          ...res.user,
        }));
        setIsEditing(false);
        success('Profile updated successfully');
      }
    } catch (err) {
      toastError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toastError('Please complete all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toastError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/api/auth/change-password', passwordData);
      success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPasswordSection(false);
    } catch (err) {
      toastError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = profileData?.name
    ? profileData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'U';

  const stats = profileData?.stats || {
    totalReviews: 0,
    totalOptimizations: 0,
    totalConversions: 0,
    totalSavedSessions: 0,
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="profile-skeleton" aria-busy="true">
          <div className="skeleton-avatar" />
          <div className="skeleton-line title" />
          <div className="skeleton-line subtitle" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-identity">
          <div className="profile-avatar-large" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{profileData?.name}</h1>
            <div className="profile-handle">@{profileData?.username}</div>
            {profileData?.bio && <p className="profile-bio">{profileData.bio}</p>}
            <div className="profile-meta-tags">
              {profileData?.location && (
                <span className="profile-meta-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profileData.location}
                </span>
              )}
              {profileData?.githubUsername && (
                <a
                  href={`https://github.com/${profileData.githubUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-meta-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  {profileData.githubUsername}
                </a>
              )}
              {profileData?.linkedinUrl && (
                <a
                  href={profileData.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-meta-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {profileData?.website && (
                <a
                  href={profileData.website}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-meta-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Developer Statistics (Section 11) */}
      <section className="stats-section">
        <h2 className="section-title">Developer Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{stats.totalReviews}</span>
            <span className="stat-label">Total Reviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalOptimizations}</span>
            <span className="stat-label">Total Optimizations</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalConversions}</span>
            <span className="stat-label">Total Conversions</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{stats.totalSavedSessions}</span>
            <span className="stat-label">Saved Sessions</span>
          </div>
        </div>
      </section>

      {/* Skills & Preferences View */}
      {!isEditing && (
        <div className="profile-details-grid">
          <div className="card">
            <h3 className="card-title">Technical Skills</h3>
            {profileData?.skills && profileData.skills.length > 0 ? (
              <div className="tags-wrapper">
                {profileData.skills.map((skill, idx) => (
                  <span key={idx} className="tag">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="card-desc">No skills listed yet. Click 'Edit Profile' to add your tech stack.</p>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Language Preferences</h3>
            <div className="pref-row">
              <span className="pref-label">Default Editor Language:</span>
              <span className="pref-value font-mono">{profileData?.defaultLanguage || 'python'}</span>
            </div>
            <div className="pref-row">
              <span className="pref-label">Supported Languages:</span>
              <div className="tags-wrapper" style={{ marginTop: 'var(--space-2)' }}>
                {(profileData?.preferredLanguages || ['python', 'javascript']).map((lang) => (
                  <span key={lang} className="tag tag-accent font-mono">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Form */}
      {isEditing && (
        <div className="card profile-edit-card">
          <h2 className="card-title">Edit Profile Information</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="edit-name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleEditChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-bio" className="form-label">
                Bio
              </label>
              <textarea
                id="edit-bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleEditChange}
                placeholder="Software engineer focused on distributed systems..."
                className="form-input form-textarea"
                maxLength={500}
              />
              <span className="form-hint">{formData.bio.length} / 500 characters</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="edit-location" className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  id="edit-location"
                  name="location"
                  value={formData.location}
                  onChange={handleEditChange}
                  placeholder="e.g. San Francisco, CA"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-github" className="form-label">
                  GitHub Username
                </label>
                <input
                  type="text"
                  id="edit-github"
                  name="githubUsername"
                  value={formData.githubUsername}
                  onChange={handleEditChange}
                  placeholder="e.g. octocat"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="edit-linkedin" className="form-label">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  id="edit-linkedin"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleEditChange}
                  placeholder="https://linkedin.com/in/username"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-website" className="form-label">
                  Personal Website
                </label>
                <input
                  type="url"
                  id="edit-website"
                  name="website"
                  value={formData.website}
                  onChange={handleEditChange}
                  placeholder="https://yourportfolio.dev"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-skills" className="form-label">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                id="edit-skills"
                name="skills"
                value={formData.skills}
                onChange={handleEditChange}
                placeholder="Python, React, Express, Distributed Systems, Docker"
                className="form-input"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="edit-default-lang" className="form-label">
                  Default Editor Language
                </label>
                <select
                  id="edit-default-lang"
                  name="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={handleEditChange}
                  className="form-input form-select"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="form-group">
                <span className="form-label">Preferred Languages</span>
                <div className="checkbox-group">
                  {['python', 'javascript', 'java', 'cpp'].map((lang) => (
                    <label key={lang} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.preferredLanguages.includes(lang)}
                        onChange={() => handleLanguageToggle(lang)}
                      />
                      <span className="font-mono">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security / Change Password Section */}
      <section className="security-section">
        <div className="card">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Security & Password</h3>
              <p className="card-desc">Keep your developer account secure by updating your credentials.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="change-password-form">
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <PasswordInput
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmNewPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <PasswordInput
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))
                    }
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
