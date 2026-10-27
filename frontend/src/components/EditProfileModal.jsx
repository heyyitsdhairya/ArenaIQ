import React, { useState } from 'react';
import { X, User, Phone, MapPin, Award, CheckCircle, Sparkles } from 'lucide-react';
import { updateUserProfile } from '../services/api';

export default function EditProfileModal({ user, onClose, onProfileUpdated }) {
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || 'Gandhinagar');
  const [area, setArea] = useState(user.area || 'Kudasan');
  const [skillTier, setSkillTier] = useState(user.skill_tier || 'Intermediate');
  const [bio, setBio] = useState(user.bio || '');
  const [selectedSports, setSelectedSports] = useState(user.favorite_sports || ['Cricket', 'Football']);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sportsOptions = ["Cricket", "Football", "Badminton", "Pickleball"];

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        name,
        phone,
        city,
        area,
        bio,
        skill_tier: skillTier,
        favorite_sports: selectedSports,
        playing_positions: user.playing_positions || {}
      };

      const res = await updateUserProfile(user.id || 'player_user', payload);
      onProfileUpdated(res.user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1rem'
    }}>
      <div className="glass-panel-glow" style={{
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0c1222',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
          <User size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.45rem', color: '#ffffff', margin: 0 }}>
            Edit Player Profile &amp; Preferences
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Update your athlete bio, preferred sports, and playing locations. Changes synchronize across match rosters and squad matchmaking.
        </p>

        {errorMsg && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', fontSize: '0.82rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Contact Phone
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Primary City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', background: '#070a12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
              >
                <option value="Gandhinagar">Gandhinagar</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Neighborhood / Area
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Skill & Competitiveness Tier
            </label>
            <select
              value={skillTier}
              onChange={(e) => setSkillTier(e.target.value)}
              style={{ width: '100%', background: '#070a12', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.88rem' }}
            >
              <option value="Casual & Recreational Tier">Casual & Recreational Tier</option>
              <option value="Intermediate Club Tier">Intermediate Club Tier</option>
              <option value="Tournament / Advanced Tier">Tournament / Advanced Tier</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Sports You Play:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sportsOptions.map((s) => {
                const isSelected = selectedSports.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSport(s)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#38bdf8' : 'var(--text-muted)'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{s}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Player Bio / Match Motto
            </label>
            <textarea
              rows="3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other captains about your playing style, availability, and positions..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', color: '#ffffff', outline: 'none', fontSize: '0.88rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
