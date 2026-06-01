'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2,
    MapPin,
    Clock,
    Image as ImageIcon,
    Plus,
    Minus,
    Check,
    ChevronRight,
    ChevronLeft,
    Loader2,
    AlertCircle,
    X,
    Upload,
    Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * AddFacilityForm Component
 * Multi-step form for adding a new facility
 */
export default function AddFacilityForm() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: '',
        description: '',
        phone: '',
        email: '',

        // Step 2: Location
        address: '',
        city: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',

        // Step 3: Operating Hours
        operatingHours: {
            monday: { open: '06:00', close: '22:00', closed: false },
            tuesday: { open: '06:00', close: '22:00', closed: false },
            wednesday: { open: '06:00', close: '22:00', closed: false },
            thursday: { open: '06:00', close: '22:00', closed: false },
            friday: { open: '06:00', close: '22:00', closed: false },
            saturday: { open: '06:00', close: '22:00', closed: false },
            sunday: { open: '08:00', close: '20:00', closed: false }
        },

        // Step 4: Amenities
        amenities: []
    });

    // Available amenities
    const availableAmenities = [
        { id: 'parking', label: 'Parking', icon: 'directions_car' },
        { id: 'changing_room', label: 'Changing Room', icon: 'door_front' },
        { id: 'shower', label: 'Shower', icon: 'shower' },
        { id: 'locker', label: 'Locker', icon: 'lock' },
        { id: 'cafeteria', label: 'Cafeteria', icon: 'local_cafe' },
        { id: 'wifi', label: 'Free WiFi', icon: 'wifi' },
        { id: 'first_aid', label: 'First Aid', icon: 'medical_services' },
        { id: 'water', label: 'Drinking Water', icon: 'water_drop' },
        { id: 'equipment_rental', label: 'Equipment Rental', icon: 'sports_tennis' },
        { id: 'coaching', label: 'Coaching Available', icon: 'school' },
        { id: 'spectator_area', label: 'Spectator Area', icon: 'visibility' },
        { id: 'ac', label: 'Air Conditioned', icon: 'ac_unit' }
    ];

    const steps = [
        { number: 1, title: 'Basics', icon: 'domain' },
        { number: 2, title: 'Location', icon: 'location_on' },
        { number: 3, title: 'Hours', icon: 'schedule' },
        { number: 4, title: 'Amenities', icon: 'check' }
    ];

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/auth/login?redirect=/owner/facilities/new');
            return;
        }

        if (user.role !== 'FACILITY_OWNER' && user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
    }, [user, authLoading]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOperatingHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [day]: {
                    ...prev.operatingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const toggleAmenity = (amenityId) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenityId)
                ? prev.amenities.filter(id => id !== amenityId)
                : [...prev.amenities, amenityId]
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.name && formData.description;
            case 2:
                return formData.address && formData.city && formData.state && formData.pincode;
            case 3:
                return true; // Operating hours have defaults
            case 4:
                return true; // Amenities are optional
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < 4) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('quickcourt_token='))
                ?.split('=')[1];

            if (!token) {
                throw new Error('Please login to add a facility');
            }

            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    operatingHours: formData.operatingHours,
                    amenities: formData.amenities
                })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/owner/facilities');
                }, 2000);
            } else {
                throw new Error(data.message || 'Failed to create facility');
            }
        } catch (err) {
            console.error('Create facility error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-surface pt-20 flex items-center justify-center p-4">
                <div className="card p-8 max-w-md w-full text-center anim-slide-up">
                    <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mx-auto mb-6">
                        <Icon name="check_circle" size={40} filled />
                    </div>
                    <h2 className="font-display text-2xl font-semibold text-on-surface mb-2">Facility Created!</h2>
                    <p className="text-on-surface-variant mb-2">
                        Your facility has been submitted for review.
                    </p>
                    <p className="text-sm text-outline">
                        Redirecting to facilities page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pt-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/owner/facilities"
                        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
                    >
                        <Icon name="arrow_back" size={18} />
                        Back to Facilities
                    </Link>
                    <p className="eyebrow mb-2">New Facility</p>
                    <h1 className="font-display text-3xl sm:text-4xl font-semibold text-on-surface tracking-tight">Add New Facility</h1>
                    <p className="text-on-surface-variant mt-2">Fill in the details to create a new sports venue</p>
                </div>

                {/* Progress Steps */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const isCompleted = currentStep > step.number;
                            const isCurrent = currentStep === step.number;

                            return (
                                <div key={step.number} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                                isCompleted
                                                    ? 'bg-primary-container text-on-primary-container'
                                                    : isCurrent
                                                        ? 'bg-primary text-on-primary shadow-md'
                                                        : 'bg-surface-container text-on-surface-variant'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <Icon name="check" size={22} />
                                            ) : (
                                                <Icon name={step.icon} size={22} />
                                            )}
                                        </div>
                                        <p className={`text-xs mt-2 font-mono uppercase tracking-wider ${
                                            isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-on-primary-container' : 'text-outline'
                                        }`}>
                                            {step.title}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                                            isCompleted ? 'bg-primary-container' : 'bg-outline-variant'
                                        }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="card p-8">
                    {error && (
                        <div className="flex items-center gap-3 bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-6">
                            <Icon name="error" size={20} />
                            <p className="text-sm flex-1">{error}</p>
                            <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
                                <Icon name="close" size={18} />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/30">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold">1</div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-primary">Basic Information</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Enter the basic details about your sports facility.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                    Facility Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="input"
                                    placeholder="e.g., Champions Sports Arena"
                                />
                            </div>

                            <div>
                                <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    className="input resize-none"
                                    placeholder="Describe your facility, what sports you offer, unique features..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="input"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="input"
                                        placeholder="contact@facility.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/30">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold">2</div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-primary">Location Details</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Enter the address where your facility is located.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                    Street Address *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                                        <Icon name="location_on" size={20} />
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="input pl-10"
                                        placeholder="123 Sports Complex Road"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        className="input"
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div>
                                    <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className="input"
                                        placeholder="Maharashtra"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-mono text-sm text-on-surface-variant mb-1.5">
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        className="input font-mono"
                                        placeholder="400001"
                                    />
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div className="w-full h-[200px] rounded-lg bg-surface-container overflow-hidden border border-outline-variant relative flex items-center justify-center">
                                <Icon name="map" size={64} className="text-outline-variant" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-secondary-container">
                                        <Icon name="location_on" size={48} filled />
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-outline-variant/30 pt-6">
                                <p className="font-mono text-sm text-on-surface-variant mb-4 uppercase tracking-wider">
                                    GPS Coordinates (Optional)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-outline mb-2 font-mono">Latitude</label>
                                        <input
                                            type="text"
                                            value={formData.latitude}
                                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                                            className="input font-mono"
                                            placeholder="19.0760"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-outline mb-2 font-mono">Longitude</label>
                                        <input
                                            type="text"
                                            value={formData.longitude}
                                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                                            className="input font-mono"
                                            placeholder="72.8777"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Operating Hours */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/30">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold">3</div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-primary">Operating Hours</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Set the opening and closing times for each day.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(formData.operatingHours).map(([day, hours]) => (
                                    <div
                                        key={day}
                                        className="flex flex-wrap items-center gap-4 p-4 bg-surface-container-low rounded-xl"
                                    >
                                        <div className="w-24">
                                            <p className="font-mono font-bold text-on-surface capitalize text-sm">{day}</p>
                                        </div>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!hours.closed}
                                                onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                                                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
                                            />
                                            <span className="text-sm text-on-surface-variant">Open</span>
                                        </label>

                                        {!hours.closed && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <input
                                                    type="time"
                                                    value={hours.open}
                                                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                                    className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-lowest text-on-surface font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                                                />
                                                <span className="text-outline">to</span>
                                                <input
                                                    type="time"
                                                    value={hours.close}
                                                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                                    className="px-3 py-2 rounded-lg border border-outline-variant text-sm bg-surface-container-lowest text-on-surface font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow"
                                                />
                                            </div>
                                        )}

                                        {hours.closed && (
                                            <span className="pill error">Closed</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Amenities */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-outline-variant/30">
                                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-bold">4</div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-primary">Amenities</h3>
                                    <p className="text-sm text-on-surface-variant mt-1">
                                        Select all the amenities available at your facility.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {availableAmenities.map((amenity) => {
                                    const isSelected = formData.amenities.includes(amenity.id);
                                    return (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`px-4 py-2 rounded-full border font-mono text-sm transition-all flex items-center gap-2 ${
                                                isSelected
                                                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-sm'
                                                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary hover:text-primary'
                                            }`}
                                        >
                                            <Icon name={amenity.icon} size={18} />
                                            <span>{amenity.label}</span>
                                            {isSelected && <Icon name="check" size={16} />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-4 bg-tertiary/5 border border-tertiary/20 rounded-lg flex gap-3">
                                <Icon name="info" size={20} className="text-tertiary shrink-0 mt-0.5" />
                                <p className="text-sm text-on-surface-variant">
                                    <strong className="text-on-surface">Note:</strong> You can add courts and upload photos after creating the facility.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-outline-variant/40">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="btn btn-outline"
                            >
                                <Icon name="chevron_left" size={18} />
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                disabled={!validateStep(currentStep)}
                                className="btn btn-cta disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Step
                                <Icon name="chevron_right" size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn btn-cta disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Icon name="progress_activity" size={18} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Facility
                                        <Icon name="check" size={18} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
