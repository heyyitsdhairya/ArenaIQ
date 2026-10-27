import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, BarChart3, CalendarCheck, ShieldCheck, RefreshCw,
  LogOut, ArrowRight, Zap, CheckCircle2, MapPin, DollarSign,
  TrendingUp, Sliders, Users, Radio, Sparkles, AlertCircle, HardDrive,
  Check, Edit3, Calendar, Clock, X, Lock, Unlock, Wrench, ChevronDown
} from 'lucide-react';
import {
  fetchPartnerVenues, createVenueListing, fetchPartnerBookings,
  fetchRealtimeMetrics, triggerHadoopMapReduce, fetchBatchAnalytics,
  fetchSlots, updateVenueDetails, updateVenueSlot, addCourtToVenue
} from '../services/api';
import LiveEventTicker from '../components/LiveEventTicker';
import MapReduceViewer from '../components/MapReduceViewer';
import PipelineHealthBar from '../components/PipelineHealthBar';
import ArchitectureDiagram from '../components/ArchitectureDiagram';
import FacultyDemoPanel from '../components/FacultyDemoPanel';
import partnerLogo from '../assets/partner_logo.jpg';

const PRESET_TURF_IMAGES = [
  { label: "Night Floodlit Turf (Cricket/Football)", url: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=60" },
  { label: "Indoor Wooden Badminton Court", url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=60" },
  { label: "Pro Acrylic Pickleball Court", url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&auto=format&fit=crop&q=60" },
  { label: "Olympic Monofilament Turf", url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=60" }
];

const AMENITY_OPTIONS = [
  "Floodlights", "Locker Room", "Free Parking", "Rental Bats & Balls",
  "Cafeteria", "Changing Shower", "Air Conditioned Lounge", "Yonex Stringing",
  "VIP Lounge", "Digital Scoreboard", "EV Charging", "Drinking Water"
];

export default function PartnerHub({ partner, onLogout, onSwitchToPlayerPortal }) {
  const [activeTab, setActiveTab] = useState('venues'); // 'venues', 'add_venue', 'intelligence', 'bookings', 'kyc'
  const [myVenues, setMyVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [realtime, setRealtime] = useState(null);
  const [batchData, setBatchData] = useState(null);

  // New Venue Listing Form State
  const [venueName, setVenueName] = useState('');
  const [tagline, setTagline] = useState('');
  const [city, setCity] = useState(partner?.city || 'Ahmedabad');
  const [area, setArea] = useState(partner?.area || 'Sindhu Bhavan / Bodakdev');
  const [address, setAddress] = useState('');
  const [selectedSports, setSelectedSports] = useState(['Cricket', 'Football']);
  const [selectedAmenities, setSelectedAmenities] = useState(['Floodlights', 'Free Parking', 'Locker Room']);
  const [imageUrl, setImageUrl] = useState(PRESET_TURF_IMAGES[0].url);
  const [courts, setCourts] = useState([
    { name: 'Pitch 1 (Box Cricket)', sport: 'Cricket', surface: 'FIFA Grade 50mm AstroTurf', default_price: 1200 },
    { name: 'Cage 2 (5v5 Futsal)', sport: 'Football', surface: 'Shock-Absorbing Rubber Infill', default_price: 1400 }
  ]);
  const [submittingVenue, setSubmittingVenue] = useState(false);
  const [listingSuccess, setListingSuccess] = useState(null);

  // SLOT MANAGEMENT MODAL STATE
  const [slotModalVenue, setSlotModalVenue] = useState(null);
  const [slotModalDate, setSlotModalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotModalCourt, setSlotModalCourt] = useState('all');
  const [managedSlots, setManagedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotFeedback, setSlotFeedback] = useState('');

  // EDIT VENUE MODAL STATE
  const [editVenueModal, setEditVenueModal] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAmenities, setEditAmenities] = useState([]);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);

  // ADD COURT TO EXISTING VENUE STATE
  const [showAddCourtForm, setShowAddCourtForm] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtSport, setNewCourtSport] = useState('Cricket');
  const [newCourtSurface, setNewCourtSurface] = useState('FIFA Grade 50mm AstroTurf');
  const [newCourtPrice, setNewCourtPrice] = useState(1000);

  // Dynamic pricing rule levers (Manager state)
  const [offPeakDiscount, setOffPeakDiscount] = useState(35);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.25);
  const [rulesSavedNotice, setRulesSavedNotice] = useState(false);

  useEffect(() => {
    loadPartnerData();
    const interval = setInterval(loadTelemetry, 2500);
    return () => clearInterval(interval);
  }, [partner?.id]);

  async function loadPartnerData() {
    if (!partner?.id) return;
    setLoading(true);
    try {
      const [vData, bData, rt, bt] = await Promise.all([
        fetchPartnerVenues(partner.id),
        fetchPartnerBookings(partner.id),
        fetchRealtimeMetrics(),
        fetchBatchAnalytics()
      ]);
      setMyVenues(vData.venues || []);
      setBookings(bData.bookings || []);
      setTotalRevenue(bData.total_revenue || 0);
      setRealtime(rt);
      setBatchData(bt);
    } catch (err) {
      console.error("Failed to load partner data", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTelemetry() {
    try {
      const rt = await fetchRealtimeMetrics();
      setRealtime(rt);
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // MANUAL SLOT MANAGEMENT HANDLERS
  // --------------------------------------------------------------------------
  async function openSlotManager(venue) {
    setSlotModalVenue(venue);
    setSlotModalCourt('all');
    loadVenueSlotsForDate(venue.id, slotModalDate);
  }

  async function loadVenueSlotsForDate(venueId, dateStr) {
    setLoadingSlots(true);
    try {
      const data = await fetchSlots(venueId, dateStr);
      setManagedSlots(data.slots || []);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleToggleSlotStatus(slot, targetStatus, customBookedBy = null) {
    if (!slotModalVenue) return;
    try {
      const payload = {
        status: targetStatus,
        booked_by: customBookedBy
      };
      await updateVenueSlot(slotModalVenue.id, slot.slot_id, payload);
      setSlotFeedback(`Slot ${slot.time_12h || slot.start_time} updated to ${targetStatus.toUpperCase()}!`);
      setTimeout(() => setSlotFeedback(''), 2500);

      // Refresh slots
      loadVenueSlotsForDate(slotModalVenue.id, slotModalDate);
    } catch (err) {
      alert(err.message || "Failed to update slot status");
    }
  }

  async function handleUpdateSlotPrice(slot, newPrice) {
    if (!slotModalVenue) return;
    const p = parseFloat(newPrice);
    if (isNaN(p) || p <= 0) return;
    try {
      await updateVenueSlot(slotModalVenue.id, slot.slot_id, { dynamic_price: p });
      setSlotFeedback(`Slot price updated to ₹${p}!`);
      setTimeout(() => setSlotFeedback(''), 2500);
      loadVenueSlotsForDate(slotModalVenue.id, slotModalDate);
    } catch (err) {
      alert(err.message || "Failed to update slot price");
    }
  }

  async function handleToggleSlotPeak(slot) {
    if (!slotModalVenue) return;
    try {
      await updateVenueSlot(slotModalVenue.id, slot.slot_id, {
        is_peak: !slot.is_peak,
        discount_pct: slot.is_peak ? 35 : 0
      });
      setSlotFeedback(`Slot peak status toggled!`);
      setTimeout(() => setSlotFeedback(''), 2500);
      loadVenueSlotsForDate(slotModalVenue.id, slotModalDate);
    } catch (err) {
      alert(err.message || "Failed to toggle peak status");
    }
  }

  // --------------------------------------------------------------------------
  // EDIT VENUE DETAILS HANDLERS
  // --------------------------------------------------------------------------
  function openEditVenueModal(venue) {
    setEditVenueModal(venue);
    setEditName(venue.name || '');
    setEditTagline(venue.tagline || '');
    setEditCity(venue.city || 'Ahmedabad');
    setEditArea(venue.area || '');
    setEditAddress(venue.address || '');
    setEditAmenities(venue.amenities || []);
    setEditImageUrl(venue.image_url || PRESET_TURF_IMAGES[0].url);
    setShowAddCourtForm(false);
  }

  async function handleSaveVenueEdit(e) {
    e.preventDefault();
    if (!editVenueModal) return;
    setSavingVenue(true);
    try {
      const payload = {
        name: editName.trim(),
        tagline: editTagline.trim(),
        city: editCity.trim(),
        area: editArea.trim(),
        address: editAddress.trim(),
        amenities: editAmenities,
        image_url: editImageUrl
      };
      await updateVenueDetails(editVenueModal.id, payload);
      alert("Venue details updated successfully!");
      setEditVenueModal(null);
      loadPartnerData();
    } catch (err) {
      alert(err.message || "Failed to update venue");
    } finally {
      setSavingVenue(false);
    }
  }

  async function handleAddCourtToExistingVenue() {
    if (!editVenueModal || !newCourtName.trim()) {
      alert("Please enter a court name.");
      return;
    }
    try {
      const courtPayload = {
        name: newCourtName.trim(),
        sport: newCourtSport,
        surface: newCourtSurface,
        default_price: parseFloat(newCourtPrice) || 1000
      };
      await addCourtToVenue(editVenueModal.id, courtPayload);
      alert(`Court "${newCourtName}" added with 3 days of generated slots!`);
      setShowAddCourtForm(false);
      setNewCourtName('');
      loadPartnerData();
      setEditVenueModal(null);
    } catch (err) {
      alert(err.message || "Failed to add court");
    }
  }

  // --------------------------------------------------------------------------
  // NEW VENUE CREATION HANDLERS
  // --------------------------------------------------------------------------
  function handleAddCourtRow() {
    setCourts([
      ...courts,
      {
        name: `Court ${courts.length + 1} (${selectedSports[0] || 'Cricket'})`,
        sport: selectedSports[0] || 'Cricket',
        surface: 'FIFA Grade AstroTurf',
        default_price: 1000
      }
    ]);
  }

  function handleRemoveCourtRow(idx) {
    if (courts.length <= 1) return;
    setCourts(courts.filter((_, i) => i !== idx));
  }

  function handleCourtChange(idx, field, value) {
    const updated = [...courts];
    updated[idx][field] = value;
    setCourts(updated);
  }

  function toggleSport(s) {
    if (selectedSports.includes(s)) {
      if (selectedSports.length > 1) {
        setSelectedSports(selectedSports.filter(item => item !== s));
      }
    } else {
      setSelectedSports([...selectedSports, s]);
    }
  }

  function toggleAmenity(a) {
    if (selectedAmenities.includes(a)) {
      setSelectedAmenities(selectedAmenities.filter(item => item !== a));
    } else {
      setSelectedAmenities([...selectedAmenities, a]);
    }
  }

  function toggleEditAmenity(a) {
    if (editAmenities.includes(a)) {
      setEditAmenities(editAmenities.filter(item => item !== a));
    } else {
      setEditAmenities([...editAmenities, a]);
    }
  }

  async function handleCreateVenueSubmit(e) {
    e.preventDefault();
    if (!venueName.trim() || !address.trim()) {
      alert("Please provide the venue name and full physical address.");
      return;
    }

    setSubmittingVenue(true);
    try {
      const payload = {
        name: venueName.trim(),
        tagline: tagline.trim() || `Premier Sports Arena in ${area}, ${city}`,
        sports: selectedSports,
        city: city.trim(),
        area: area.trim(),
        address: address.trim(),
        amenities: selectedAmenities,
        image_url: imageUrl,
        courts: courts.map(c => ({
          name: c.name,
          sport: c.sport,
          surface: c.surface,
          default_price: parseFloat(c.default_price) || 1000
        })),
        owner_id: partner.id
      };

      const res = await createVenueListing(payload);
      setListingSuccess(res.venue);

      await loadPartnerData();

      setVenueName('');
      setTagline('');
      setAddress('');

      setTimeout(() => {
        setListingSuccess(null);
        setActiveTab('venues');
      }, 2500);

    } catch (err) {
      alert(err.message || "Failed to publish venue listing");
    } finally {
      setSubmittingVenue(false);
    }
  }

  // Filter slots for modal
  const displayedSlots = managedSlots.filter(s => {
    if (slotModalCourt === 'all') return true;
    return s.court_id === slotModalCourt;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#070a12', color: '#ffffff' }}>
      
      {/* =========================================================================
          EXCLUSIVE VENUE PARTNER HEADER WITH GEMINI-GENERATED LOGO
      ========================================================================= */}
      <header style={{
        borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
        background: 'rgba(12, 16, 28, 0.95)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 60,
        padding: '0.8rem 2rem'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Partner Brand with Generated Partner Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={partnerLogo}
              alt="ArenaIQ Partner Hub Logo"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                objectFit: 'cover',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.45)',
                border: '1px solid rgba(168, 85, 247, 0.4)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                  Arena<span style={{ color: '#c084fc' }}>IQ</span>
                </span>
                <span style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#d8b4fe',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em'
                }}>
                  PARTNER HUB
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: 0 }}>
                {partner?.business_name || "Arena Partner Hub"} • {partner?.city || "Gujarat"}
              </p>
            </div>
          </div>

          {/* Partner Navigation Tabs */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.03)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setActiveTab('venues')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: activeTab === 'venues' ? 'rgba(168, 85, 247, 0.22)' : 'transparent',
                color: activeTab === 'venues' ? '#d8b4fe' : 'var(--text-muted)',
                border: activeTab === 'venues' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <Building2 size={15} /> My Arenas ({myVenues.length})
            </button>

            <button
              onClick={() => setActiveTab('add_venue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: activeTab === 'add_venue' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                color: activeTab === 'add_venue' ? '#34d399' : 'var(--text-muted)',
                border: activeTab === 'add_venue' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <Plus size={15} /> List New Arena
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: activeTab === 'intelligence' ? 'rgba(6, 182, 212, 0.22)' : 'transparent',
                color: activeTab === 'intelligence' ? '#38bdf8' : 'var(--text-muted)',
                border: activeTab === 'intelligence' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <BarChart3 size={15} /> Big Data Intelligence
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: activeTab === 'bookings' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                color: activeTab === 'bookings' ? '#fbbf24' : 'var(--text-muted)',
                border: activeTab === 'bookings' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <CalendarCheck size={15} /> Bookings ({bookings.length})
            </button>

            <button
              onClick={() => setActiveTab('kyc')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: activeTab === 'kyc' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: activeTab === 'kyc' ? '#ffffff' : 'var(--text-muted)',
                border: activeTab === 'kyc' ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <ShieldCheck size={15} color="#34d399" /> Business KYC
            </button>
          </nav>

          {/* Right Action Switchers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onSwitchToPlayerPortal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
              title="Open the player-facing arena booking portal"
            >
              <span>🏃 Player View</span>
            </button>

            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
              title="Sign out of Partner Console"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 2rem 4rem 2rem' }}>

        {/* Banner Alert: Verified Partner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.2rem 1.6rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={partnerLogo}
              alt="Partner Badge"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                objectFit: 'cover',
                border: '1px solid rgba(168, 85, 247, 0.4)'
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1.02rem', color: '#ffffff' }}>
                  {partner?.business_name || 'Arena Business'}
                </strong>
                <span className="badge badge-lime" style={{ fontSize: '0.65rem' }}>
                  GENUINE VERIFIED PARTNER
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                GSTIN: <span className="font-mono" style={{ color: '#c084fc' }}>{partner?.gst_number || '24AAACG9988F1Z2'}</span> • Operating in {partner?.area || 'Bodakdev'}, {partner?.city || 'Ahmedabad'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Managed Venues</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#c084fc' }}>{myVenues.length}</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Confirmed Revenue</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>₹{totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: MY LISTED ARENAS (WITH MANUAL SLOT & VENUE MANAGEMENT)
        ========================================================================= */}
        {activeTab === 'venues' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  My Registered Sports Venues
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Manage court inventory, manually lock or release slots, override prices, and update venue details.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('add_venue')}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  padding: '10px 18px',
                  fontSize: '0.84rem'
                }}
              >
                <Plus size={16} /> List a New Sports Venue
              </button>
            </div>

            {myVenues.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <Building2 size={48} color="#a855f7" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Venues Listed Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                  Register your first sports arena or box cricket turf into ArenaIQ to start accepting online bookings.
                </p>
                <button
                  onClick={() => setActiveTab('add_venue')}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                >
                  <Plus size={16} /> List Your First Venue
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '1.6rem' }}>
                {myVenues.map((venue) => (
                  <div key={venue.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={venue.image_url}
                        alt={venue.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        gap: '6px'
                      }}>
                        {venue.sports?.map(sp => (
                          <span key={sp} className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                            {sp}
                          </span>
                        ))}
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        color: '#fbbf24',
                        fontWeight: 700
                      }}>
                        ★ {venue.rating || 5.0} ({venue.total_reviews || 1} reviews)
                      </div>
                    </div>

                    <div style={{ padding: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {venue.name}
                        </h3>
                        <span className="badge badge-lime font-mono" style={{ fontSize: '0.65rem' }}>
                          LIVE IN CATALOG
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.8rem 0' }}>
                        {venue.tagline}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        <MapPin size={13} color="var(--accent-cyan)" />
                        <span>{venue.area}, {venue.city}</span>
                      </div>

                      {/* Courts Summary */}
                      <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '1.2rem'
                      }}>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700 }}>
                          Courts &amp; Pitches ({venue.courts?.length || 0})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {venue.courts?.map(c => (
                            <div key={c.court_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                              <span style={{ color: '#f3f4f6' }}>• {c.name} <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>({c.surface})</span></span>
                              <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>
                                ₹{c.default_price}/hr
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Management Action Buttons (NO RAW API) */}
                      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button
                          onClick={() => openSlotManager(venue)}
                          className="btn btn-primary"
                          style={{
                            padding: '9px 12px',
                            fontSize: '0.8rem',
                            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                            fontWeight: 700
                          }}
                        >
                          <Calendar size={14} /> Manage Slots &amp; Rates
                        </button>

                        <button
                          onClick={() => openEditVenueModal(venue)}
                          className="btn btn-secondary"
                          style={{
                            padding: '9px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          <Edit3 size={14} /> Edit Venue &amp; Pitches
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: LIST A NEW VENUE / ARENA
        ========================================================================= */}
        {activeTab === 'add_venue' && (
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.8rem' }}>
              <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                List Your Sports Arena / Turf
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Fill in your arena details. ArenaIQ will automatically generate 3 days of court slot availability with dynamic off-peak discounts.
              </p>
            </div>

            {listingSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '14px',
                padding: '1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <CheckCircle2 size={32} color="#34d399" />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>
                    Venue Successfully Listed!
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#a7f3d0' }}>
                    "{listingSuccess.name}" is now live in the Ahmedabad &amp; Gandhinagar catalog. Redirecting to your arenas...
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateVenueSubmit} className="glass-panel" style={{ padding: '2rem' }}>
              {/* Section 1: Basic Identity */}
              <div style={{ marginBottom: '1.8rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#c084fc', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} /> 1. Arena Identity &amp; Branding
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label>Arena / Turf Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Strike Arena & Box Cricket Club"
                      value={venueName}
                      onChange={e => setVenueName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label>Catchy Tagline</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Ahmedabad's Premier Olympic Floodlit Turf"
                      value={tagline}
                      onChange={e => setTagline(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label>Operating City *</label>
                    <select
                      className="input-field"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    >
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Gandhinagar">Gandhinagar</option>
                      <option value="Surat">Surat</option>
                      <option value="Vadodara">Vadodara</option>
                    </select>
                  </div>

                  <div>
                    <label>Neighborhood / Area *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Sindhu Bhavan / Bodakdev"
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label>Full Physical Address *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Opp. Taj Skyline, Off Sindhu Bhavan Marg, Ahmedabad 380054"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Section 2: Sports & Amenities */}
              <div style={{ marginBottom: '1.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#c084fc', margin: '0 0 1rem 0' }}>
                  2. Sports Facilities &amp; Amenities
                </h4>

                <div style={{ marginBottom: '1rem' }}>
                  <label>Sports Supported (Select all that apply):</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {["Cricket", "Football", "Badminton", "Pickleball", "Tennis"].map(sp => (
                      <button
                        type="button"
                        key={sp}
                        onClick={() => toggleSport(sp)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: selectedSports.includes(sp) ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.03)',
                          border: selectedSports.includes(sp) ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                          color: selectedSports.includes(sp) ? '#ffffff' : 'var(--text-muted)'
                        }}
                      >
                        {selectedSports.includes(sp) ? '✓ ' : '+ '}{sp}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label>Turf Amenities &amp; Services:</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {AMENITY_OPTIONS.map(am => (
                      <button
                        type="button"
                        key={am}
                        onClick={() => toggleAmenity(am)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          background: selectedAmenities.includes(am) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.02)',
                          border: selectedAmenities.includes(am) ? '1px solid #34d399' : '1px solid var(--border-subtle)',
                          color: selectedAmenities.includes(am) ? '#34d399' : 'var(--text-dim)'
                        }}
                      >
                        {selectedAmenities.includes(am) ? '✓ ' : ''}{am}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Courts & Hourly Base Rates */}
              <div style={{ marginBottom: '1.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#c084fc', margin: 0 }}>
                    3. Courts, Pitches &amp; Standard Hourly Rates
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCourtRow}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                  >
                    <Plus size={14} /> Add Another Court
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {courts.map((court, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) 40px',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <label>Court Name</label>
                        <input
                          type="text"
                          className="input-field"
                          value={court.name}
                          onChange={e => handleCourtChange(idx, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <label>Sport</label>
                        <select
                          className="input-field"
                          value={court.sport}
                          onChange={e => handleCourtChange(idx, 'sport', e.target.value)}
                        >
                          {selectedSports.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label>Turf Surface</label>
                        <input
                          type="text"
                          className="input-field"
                          value={court.surface}
                          onChange={e => handleCourtChange(idx, 'surface', e.target.value)}
                        />
                      </div>

                      <div>
                        <label>Base Rate (₹/hr)</label>
                        <input
                          type="number"
                          className="input-field font-mono"
                          value={court.default_price}
                          onChange={e => handleCourtChange(idx, 'default_price', e.target.value)}
                          step="50"
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {courts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCourtRow(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fb7185',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Remove Court"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Photo Selection */}
              <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.4rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#c084fc', margin: '0 0 1rem 0' }}>
                  4. High-Resolution Arena Photography
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '1rem' }}>
                  {PRESET_TURF_IMAGES.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setImageUrl(img.url)}
                      style={{
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: imageUrl === img.url ? '2px solid #a855f7' : '1px solid var(--border-subtle)',
                        boxShadow: imageUrl === img.url ? '0 0 14px rgba(168, 85, 247, 0.4)' : 'none'
                      }}
                    >
                      <img src={img.url} alt={img.label} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                      <div style={{ padding: '6px 8px', fontSize: '0.7rem', color: imageUrl === img.url ? '#d8b4fe' : 'var(--text-muted)' }}>
                        {img.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label>Or Custom Photo Image URL:</label>
                  <input
                    type="url"
                    className="input-field"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingVenue}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)'
                }}
              >
                {submittingVenue ? "Publishing Venue & Generating Slots..." : "🚀 Publish Venue to ArenaIQ Live Catalog"}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 3: DEMAND INTELLIGENCE & BIG DATA HUB
        ========================================================================= */}
        {activeTab === 'intelligence' && (
          <div>
            <div style={{ marginBottom: '1.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-purple font-mono" style={{ fontSize: '0.7rem' }}>
                  EXCLUSIVE PARTNER METRICS
                </span>
                <span className="badge badge-lime" style={{ fontSize: '0.7rem' }}>
                  KAFKA + MAPREDUCE SPEED LAYER
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Demand Intelligence &amp; Dynamic Pricing Levers
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Simulate price elasticity, inspect high-velocity event throughput, and execute Hadoop Streaming jobs over partitioned HDFS storage.
              </p>
            </div>

            {/* Dynamic Pricing Yield Levers */}
            <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                    Dynamic Yield &amp; Off-Peak Fill Levers
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                    Adjust discount percentages for afternoon idle hours (11:00 AM – 4:00 PM) to maximize daily court utilization.
                  </p>
                </div>
                {rulesSavedNotice && (
                  <span className="badge badge-lime" style={{ fontSize: '0.75rem' }}>
                    ✓ Yield Rules Deployed to Engine
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.8rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6' }}>
                      ⚡ Off-Peak Discount Rate
                    </span>
                    <span className="font-mono" style={{ color: '#34d399', fontWeight: 700, fontSize: '0.9rem' }}>
                      {offPeakDiscount}% OFF
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="50"
                    step="5"
                    value={offPeakDiscount}
                    onChange={e => setOffPeakDiscount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Fills idle afternoon court hours: projected +18.4% total daily revenue.
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f3f4f6' }}>
                      🔥 Prime Surge Multiplier (7-10 PM)
                    </span>
                    <span className="font-mono" style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.9rem' }}>
                      {surgeMultiplier}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.5"
                    step="0.05"
                    value={surgeMultiplier}
                    onChange={e => setSurgeMultiplier(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Captures consumer surplus during high-demand weekend evenings.
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setRulesSavedNotice(true);
                    setTimeout(() => setRulesSavedNotice(false), 3000);
                  }}
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    padding: '8px 20px',
                    fontSize: '0.82rem'
                  }}
                >
                  Apply Yield Rules to My Venues
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <PipelineHealthBar realtime={realtime} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <ArchitectureDiagram />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <FacultyDemoPanel onActionSuccess={loadPartnerData} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <LiveEventTicker />
            </div>

            <div>
              <MapReduceViewer />
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: COURT BOOKINGS & REVENUE
        ========================================================================= */}
        {activeTab === 'bookings' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Incoming Reservations &amp; Settlement Log
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Real-time transaction log of court slots booked across your arenas.
                </p>
              </div>

              <button
                onClick={loadPartnerData}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} /> Refresh Log
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.8rem' }}>
                <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.74rem', color: '#6ee7b7', textTransform: 'uppercase' }}>Gross Revenue Collected</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    ₹{totalRevenue.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Zero deduction instant payout</span>
                </div>

                <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                  <div style={{ fontSize: '0.74rem', color: '#d8b4fe', textTransform: 'uppercase' }}>Total Bookings Received</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    {bookings.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Confirmed reservations</span>
                </div>

                <div style={{ padding: '1.2rem', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ fontSize: '0.74rem', color: '#67e8f9', textTransform: 'uppercase' }}>Average Booking Value</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    ₹{bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Per reservation</span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CalendarCheck size={40} color="var(--accent-purple)" style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No bookings logged for your arenas yet. Bookings made by players will appear here instantly!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                        <th style={{ padding: '10px 12px' }}>Pass ID</th>
                        <th style={{ padding: '10px 12px' }}>Customer / Captain</th>
                        <th style={{ padding: '10px 12px' }}>Court &amp; Sport</th>
                        <th style={{ padding: '10px 12px' }}>Date &amp; Time</th>
                        <th style={{ padding: '10px 12px' }}>Amount</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.booking_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#c084fc' }}>{b.booking_id}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.user_name || 'Player'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.user_phone || '+91 98765 43210'}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>{b.court_name}</div>
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{b.sport}</span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div>{b.date}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.start_time} - {b.end_time}</div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                            ₹{b.amount_paid}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge badge-lime" style={{ fontSize: '0.65rem' }}>
                              CONFIRMED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: BUSINESS KYC & VERIFICATION
        ========================================================================= */}
        {activeTab === 'kyc' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.6rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Partner Entity Verification &amp; KYC
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Your business credentials ensure genuine arena verification and unlock instant direct UPI settlements.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <img
                  src={partnerLogo}
                  alt="Verified Partner"
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                    border: '1px solid rgba(168, 85, 247, 0.4)'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff' }}>
                      {partner?.business_name || 'Bodakdev Sports Hub'}
                    </h3>
                    <span className="badge badge-lime font-mono" style={{ fontSize: '0.65rem' }}>
                      VERIFIED LEVEL 2
                    </span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Authorized Operator: <strong style={{ color: '#f3f4f6' }}>{partner?.partner_name || 'Rajesh Patel'}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Goods &amp; Services Tax ID</div>
                  <div className="font-mono" style={{ fontSize: '1rem', color: '#c084fc', marginTop: '4px', fontWeight: 700 }}>
                    {partner?.gst_number || '24AAACG9988F1Z2'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Official Business Contact</div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', marginTop: '4px' }}>
                    {partner?.email || 'partner@arenaiq.in'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {partner?.phone || '+91 98250 11223'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Primary Operating Hub</div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', marginTop: '4px' }}>
                    {partner?.area || 'Sindhu Bhavan / Bodakdev'}, {partner?.city || 'Ahmedabad'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Operating Hours</div>
                  <div style={{ fontSize: '0.9rem', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                    {partner?.operating_hours || '06:00 AM - 01:00 AM (Floodlit)'}
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#ffffff', display: 'block' }}>
                    Direct Settlement Account (T+0 Daily Payouts)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Settlements routed to: HDFC Bank •••• 4091 (IFSC: HDFC0000492)
                  </span>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  ACTIVE FOR SETTLEMENTS
                </span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL 1: MANUAL SLOT & PRICING MANAGEMENT (REPLACES RAW API)
      ========================================================================= */}
      {slotModalVenue && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '920px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0d1322',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.2rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-purple font-mono" style={{ fontSize: '0.68rem' }}>
                    MANUAL SLOT OVERRIDE
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                    {slotModalVenue.name}
                  </h3>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Override pricing, lock walk-in bookings, or mark slots for turf maintenance.
                </p>
              </div>

              <button
                onClick={() => setSlotModalVenue(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Controls: Date and Court Picker */}
            <div style={{
              padding: '1rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'rgba(0,0,0,0.2)'
            }}>
              {/* Date Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Date:</span>
                {[0, 1, 2].map(offset => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const dStr = d.toISOString().split('T')[0];
                  const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : 'Day After';
                  return (
                    <button
                      key={dStr}
                      onClick={() => {
                        setSlotModalDate(dStr);
                        loadVenueSlotsForDate(slotModalVenue.id, dStr);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: slotModalDate === dStr ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.03)',
                        border: slotModalDate === dStr ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                        color: slotModalDate === dStr ? '#ffffff' : 'var(--text-muted)'
                      }}
                    >
                      {label} ({dStr.slice(5)})
                    </button>
                  );
                })}
              </div>

              {/* Court Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Court:</span>
                <select
                  value={slotModalCourt}
                  onChange={e => setSlotModalCourt(e.target.value)}
                  style={{ width: 'auto', minWidth: '180px', padding: '6px 12px' }}
                >
                  <option value="all">All Courts ({slotModalVenue.courts?.length || 0})</option>
                  {slotModalVenue.courts?.map(c => (
                    <option key={c.court_id} value={c.court_id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slot Feedback Toast */}
            {slotFeedback && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.2)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '8px 1.6rem',
                fontSize: '0.8rem',
                color: '#6ee7b7',
                fontWeight: 600
              }}>
                ✓ {slotFeedback}
              </div>
            )}

            {/* Slots Scrollable Grid */}
            <div style={{ padding: '1.4rem 1.6rem', overflowY: 'auto', flex: 1 }}>
              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  Loading hourly court schedules...
                </div>
              ) : displayedSlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                  No slots found for this date.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                  {displayedSlots.map(slot => {
                    const isAvailable = slot.status === 'available';
                    const isBooked = slot.status === 'booked';
                    const isMaint = slot.status === 'maintenance';

                    return (
                      <div
                        key={slot.slot_id}
                        style={{
                          borderRadius: '12px',
                          padding: '12px',
                          background: isAvailable
                            ? 'rgba(16, 185, 129, 0.04)'
                            : isBooked
                            ? 'rgba(244, 63, 94, 0.06)'
                            : 'rgba(245, 158, 11, 0.06)',
                          border: isAvailable
                            ? '1px solid rgba(16, 185, 129, 0.25)'
                            : isBooked
                            ? '1px solid rgba(244, 63, 94, 0.3)'
                            : '1px solid rgba(245, 158, 11, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        {/* Time & Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>
                            {slot.time_12h || `${slot.start_time} - ${slot.end_time}`}
                          </span>
                          {slot.is_peak ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              🔥 SURGE
                            </span>
                          ) : (
                            <span className="badge badge-lime" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                              ⚡ {slot.discount_pct || 35}% OFF
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                          {slot.court_name} • <span style={{ color: 'var(--text-muted)' }}>{slot.sport}</span>
                        </div>

                        {/* Price Row with Inline Override */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Hourly Rate:</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>₹</span>
                            <input
                              type="number"
                              defaultValue={slot.dynamic_price}
                              onBlur={e => handleUpdateSlotPrice(slot, e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  handleUpdateSlotPrice(slot, e.currentTarget.value);
                                }
                              }}
                              style={{
                                width: '75px',
                                padding: '4px 6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textAlign: 'right',
                                color: '#34d399',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                              title="Type new price and press Enter or click outside to save"
                            />
                          </div>
                        </div>

                        {/* Status Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Status:</span>
                          {isAvailable && (
                            <span style={{ color: '#34d399', fontWeight: 700 }}>🟢 Available Online</span>
                          )}
                          {isBooked && (
                            <span style={{ color: '#fb7185', fontWeight: 700 }}>🔴 {slot.booked_by || 'Booked'}</span>
                          )}
                          {isMaint && (
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>🟠 Maintenance</span>
                          )}
                        </div>

                        {/* Actions Toolbar */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                          {isAvailable ? (
                            <>
                              <button
                                onClick={() => handleToggleSlotStatus(slot, 'booked', 'Walk-in Cash Player')}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  fontSize: '0.68rem',
                                  borderRadius: '6px',
                                  background: 'rgba(244, 63, 94, 0.15)',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  color: '#fb7185',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                                title="Manually mark booked for players who paid at counter"
                              >
                                🔒 Lock Walk-in
                              </button>
                              <button
                                onClick={() => handleToggleSlotStatus(slot, 'maintenance')}
                                style={{
                                  padding: '4px 6px',
                                  fontSize: '0.68rem',
                                  borderRadius: '6px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  color: '#fbbf24',
                                  cursor: 'pointer'
                                }}
                                title="Mark slot unavailable for court rolling / light maintenance"
                              >
                                <Wrench size={11} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleToggleSlotStatus(slot, 'available')}
                              style={{
                                width: '100%',
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                borderRadius: '6px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#34d399',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              🔓 Release to Available
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleSlotPeak(slot)}
                            style={{
                              padding: '4px 6px',
                              fontSize: '0.68rem',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                            title="Toggle Peak Surge / Off-peak discount"
                          >
                            ⚡/🔥
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.6rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Total Slots: {displayedSlots.length} • Overrides sync instantly with player catalog.
              </span>

              <button
                onClick={() => setSlotModalVenue(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.8rem' }}
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT VENUE & ADD COURTS
      ========================================================================= */}
      {editVenueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#0d1322',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.2rem 1.6rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#c084fc" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>
                  Edit Venue: {editVenueModal.name}
                </h3>
              </div>

              <button
                onClick={() => setEditVenueModal(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form */}
            <div style={{ padding: '1.5rem 1.6rem', overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSaveVenueEdit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label>Venue Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label>Tagline</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editTagline}
                      onChange={e => setEditTagline(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label>City</label>
                    <select
                      className="input-field"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                    >
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Gandhinagar">Gandhinagar</option>
                      <option value="Surat">Surat</option>
                      <option value="Vadodara">Vadodara</option>
                    </select>
                  </div>

                  <div>
                    <label>Neighborhood / Area</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editArea}
                      onChange={e => setEditArea(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label>Full Physical Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label>Cover Photo URL</label>
                  <input
                    type="url"
                    className="input-field"
                    value={editImageUrl}
                    onChange={e => setEditImageUrl(e.target.value)}
                  />
                </div>

                <div style={{ marginBottom: '1.4rem' }}>
                  <label>Amenities:</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {AMENITY_OPTIONS.map(am => (
                      <button
                        type="button"
                        key={am}
                        onClick={() => toggleEditAmenity(am)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          background: editAmenities.includes(am) ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.02)',
                          border: editAmenities.includes(am) ? '1px solid #c084fc' : '1px solid var(--border-subtle)',
                          color: editAmenities.includes(am) ? '#ffffff' : 'var(--text-dim)'
                        }}
                      >
                        {editAmenities.includes(am) ? '✓ ' : ''}{am}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courts Section & Add New Court */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '1.2rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '0.88rem', color: '#c084fc' }}>
                      Pitches &amp; Courts ({editVenueModal.courts?.length || 0})
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowAddCourtForm(!showAddCourtForm)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      <Plus size={12} /> Add New Court
                    </button>
                  </div>

                  {showAddCourtForm && (
                    <div style={{
                      background: 'rgba(168, 85, 247, 0.08)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label>New Court Name</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. Pitch 2"
                            value={newCourtName}
                            onChange={e => setNewCourtName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label>Sport</label>
                          <select
                            className="input-field"
                            value={newCourtSport}
                            onChange={e => setNewCourtSport(e.target.value)}
                          >
                            {["Cricket", "Football", "Badminton", "Pickleball", "Tennis"].map(sp => (
                              <option key={sp} value={sp}>{sp}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label>Surface</label>
                          <input
                            type="text"
                            className="input-field"
                            value={newCourtSurface}
                            onChange={e => setNewCourtSurface(e.target.value)}
                          />
                        </div>

                        <div>
                          <label>Base Price (₹/hr)</label>
                          <input
                            type="number"
                            className="input-field font-mono"
                            value={newCourtPrice}
                            onChange={e => setNewCourtPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddCourtForm(false)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCourtToExistingVenue}
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.74rem', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}
                        >
                          Save &amp; Generate Slots
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {editVenueModal.courts?.map(c => (
                      <div key={c.court_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', padding: '6px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)' }}>
                        <span>• {c.name} <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({c.sport} • {c.surface})</span></span>
                        <span className="font-mono" style={{ color: '#34d399', fontWeight: 700 }}>₹{c.default_price}/hr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditVenueModal(null)}
                    className="btn btn-secondary"
                    style={{ padding: '10px 18px', fontSize: '0.84rem' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingVenue}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.84rem',
                      background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                      fontWeight: 700
                    }}
                  >
                    {savingVenue ? "Saving Changes..." : "Save Venue Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
