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
        { id: 'parking', label: 'Parking', icon: '🅿️' },
        { id: 'changing_room', label: 'Changing Room', icon: '🚪' },
        { id: 'shower', label: 'Shower', icon: '🚿' },
        { id: 'locker', label: 'Locker', icon: '🔐' },
        { id: 'cafeteria', label: 'Cafeteria', icon: '☕' },
        { id: 'wifi', label: 'Free WiFi', icon: '📶' },
        { id: 'first_aid', label: 'First Aid', icon: '🏥' },
        { id: 'water', label: 'Drinking Water', icon: '💧' },
        { id: 'equipment_rental', label: 'Equipment Rental', icon: '🎾' },
        { id: 'coaching', label: 'Coaching Available', icon: '👨‍🏫' },
        { id: 'spectator_area', label: 'Spectator Area', icon: '👀' },
        { id: 'ac', label: 'Air Conditioned', icon: '❄️' }
    ];

    const steps = [
        { number: 1, title: 'Basic Info', icon: Building2 },
        { number: 2, title: 'Location', icon: MapPin },
        { number: 3, title: 'Hours', icon: Clock },
        { number: 4, title: 'Amenities', icon: Check }
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
            <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Facility Created!</h2>
                    <p className="text-slate-500 mb-2">
                        Your facility has been submitted for review.
                    </p>
                    <p className="text-sm text-slate-400">
                        Redirecting to facilities page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link 
                        href="/owner/facilities"
                        className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Facilities
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add New Facility</h1>
                    <p className="text-slate-500 mt-1">Fill in the details to create a new sports venue</p>
                </div>

                {/* Progress Steps */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = currentStep > step.number;
                            const isCurrent = currentStep === step.number;
                            
                            return (
                                <div key={step.number} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div 
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                                isCompleted 
                                                    ? 'bg-green-500 text-white' 
                                                    : isCurrent 
                                                        ? 'bg-purple-600 text-white' 
                                                        : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <p className={`text-xs mt-2 font-medium ${
                                            isCurrent ? 'text-purple-600' : 'text-slate-400'
                                        }`}>
                                            {step.title}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`w-16 sm:w-24 h-0.5 mx-2 ${
                                            isCompleted ? 'bg-green-500' : 'bg-slate-200'
                                        }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    {error && (
                        <div className="flex items-center gap-3 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Basic Information</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Enter the basic details about your sports facility.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Facility Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                    placeholder="e.g., Champions Sports Arena"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all resize-none"
                                    placeholder="Describe your facility, what sports you offer, unique features..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Contact Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="contact@facility.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Location Details</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Enter the address where your facility is located.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                    placeholder="123 Sports Complex Road"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="Mumbai"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        State *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="Maharashtra"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Pincode *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                        placeholder="400001"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <p className="text-sm font-medium text-slate-700 mb-4">
                                    GPS Coordinates (Optional)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Latitude</label>
                                        <input
                                            type="text"
                                            value={formData.latitude}
                                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                            placeholder="19.0760"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-2">Longitude</label>
                                        <input
                                            type="text"
                                            value={formData.longitude}
                                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
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
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Operating Hours</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Set the opening and closing times for each day.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(formData.operatingHours).map(([day, hours]) => (
                                    <div 
                                        key={day}
                                        className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
                                    >
                                        <div className="w-24">
                                            <p className="font-medium text-slate-900 capitalize">{day}</p>
                                        </div>
                                        
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!hours.closed}
                                                onChange={(e) => handleOperatingHoursChange(day, 'closed', !e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm text-slate-600">Open</span>
                                        </label>

                                        {!hours.closed && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                                                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                                                    />
                                                    <span className="text-slate-400">to</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                                                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {hours.closed && (
                                            <span className="text-slate-400 text-sm">Closed</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Amenities */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Amenities</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Select all the amenities available at your facility.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {availableAmenities.map((amenity) => {
                                    const isSelected = formData.amenities.includes(amenity.id);
                                    return (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                                isSelected 
                                                    ? 'border-purple-500 bg-purple-50' 
                                                    : 'border-slate-200 hover:border-purple-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{amenity.icon}</span>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                                                        {amenity.label}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-5 h-5 text-purple-600" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-4 bg-purple-50 rounded-xl">
                                <p className="text-sm text-purple-700">
                                    <strong>Note:</strong> You can add courts and upload photos after creating the facility.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 4 ? (
                            <Button
                                onClick={nextStep}
                                disabled={!validateStep(currentStep)}
                            >
                                Next Step
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Facility
                                        <Check className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
