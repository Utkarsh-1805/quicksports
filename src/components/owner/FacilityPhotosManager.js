'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useApi } from '@/contexts/ApiContext';

/**
 * FacilityPhotosManager — drag-drop multi-upload UI with cover-photo selector.
 * Used on /owner/facilities/[id] under the "Photos" tab.
 *
 * Props:
 *  - venueId: string (required)
 *  - onUploaded?: (photos) => void  — called after each successful upload
 */
export default function FacilityPhotosManager({ venueId, onUploaded }) {
    const { upload } = useApi();
    const fileInputRef = useRef(null);

    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await upload.getFacilityPhotos(venueId);
            if (res.success) {
                setPhotos(res.data?.photos || res.photos || []);
            } else {
                setError(res.error || 'Failed to load photos');
            }
        } catch (err) {
            setError(err.message || 'Failed to load photos');
        } finally {
            setLoading(false);
        }
    }, [venueId, upload]);

    useEffect(() => {
        if (venueId) fetchPhotos();
    }, [venueId, fetchPhotos]);

    const validateFiles = (files) => {
        const accepted = [];
        const errors = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                errors.push(`${file.name}: not an image`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                errors.push(`${file.name}: larger than 5MB`);
                continue;
            }
            accepted.push(file);
        }
        return { accepted, errors };
    };

    const uploadFiles = async (fileList) => {
        const files = Array.from(fileList);
        const { accepted, errors: validationErrors } = validateFiles(files);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(' · '));
        }
        if (accepted.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const total = accepted.length;
        let done = 0;
        const newPhotos = [];

        for (const file of accepted) {
            const formData = new FormData();
            formData.append('photos', file);
            try {
                const res = await upload.uploadFacilityPhotos(venueId, formData);
                if (res.success) {
                    const added = res.data?.photos || res.photos || (res.data?.photo ? [res.data.photo] : []);
                    if (Array.isArray(added) && added.length) newPhotos.push(...added);
                } else {
                    setError((prev) => (prev ? `${prev} · ` : '') + (res.error || `Upload failed for ${file.name}`));
                }
            } catch (err) {
                setError((prev) => (prev ? `${prev} · ` : '') + (err.message || `Upload failed for ${file.name}`));
            } finally {
                done += 1;
                setUploadProgress(Math.round((done / total) * 100));
            }
        }

        if (newPhotos.length > 0) {
            setPhotos((prev) => [...prev, ...newPhotos]);
            onUploaded?.(newPhotos);
        }
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1500);
    };

    const handleFileInput = (e) => {
        if (e.target.files?.length) uploadFiles(e.target.files);
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    };

    const handleDelete = async (photoId) => {
        if (!confirm('Delete this photo?')) return;
        setDeletingId(photoId);
        try {
            const res = await upload.deleteFacilityPhoto(photoId);
            if (res.success) {
                setPhotos((prev) => prev.filter((p) => p.id !== photoId));
            } else {
                setError(res.error || 'Failed to delete photo');
            }
        } catch (err) {
            setError(err.message || 'Failed to delete photo');
        } finally {
            setDeletingId(null);
        }
    };

    const coverPhoto = photos[0];
    const otherPhotos = photos.slice(1);

    return (
        <div className="space-y-6">
            {/* Drop zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
                    ${dragOver
                        ? 'border-primary bg-primary-container/15'
                        : 'border-outline-variant bg-surface-container-low hover:border-primary/40 hover:bg-surface-container'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={uploading}
                />
                <div className="py-10 px-6 text-center">
                    <Icon name={uploading ? 'progress_activity' : 'cloud_upload'} size={36} className={`text-primary mx-auto mb-3 ${uploading ? 'animate-spin' : ''}`} />
                    <p className="font-display text-on-surface font-semibold mb-1">
                        {uploading ? `Uploading… ${uploadProgress}%` : 'Drop photos here or click to upload'}
                    </p>
                    <p className="text-sm text-on-surface-variant">JPG, PNG, WEBP · up to 5MB each · multi-select</p>
                </div>
                {uploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high overflow-hidden rounded-b-2xl">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Error banner */}
            {error && (
                <div className="bg-error-container/40 rounded-2xl p-4 flex items-start gap-3 text-on-error-container">
                    <Icon name="error" size={20} />
                    <div className="text-sm font-medium flex-1">{error}</div>
                    <button
                        onClick={() => setError(null)}
                        aria-label="Dismiss"
                        className="text-on-error-container/70 hover:text-on-error-container"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>
            )}

            {/* Photo grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[4/3] bg-surface-container animate-pulse rounded-xl" />
                    ))}
                </div>
            ) : photos.length === 0 ? (
                <div className="text-center py-12 card">
                    <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center mb-3">
                        <Icon name="photo_library" size={32} className="text-outline" />
                    </div>
                    <p className="font-display text-on-surface font-semibold">No photos yet</p>
                    <p className="text-sm text-on-surface-variant mt-1">Upload your first photo using the area above.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Cover photo */}
                    {coverPhoto && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-display text-lg font-semibold text-on-surface">Cover Photo</h4>
                                <span className="pill">Featured</span>
                            </div>
                            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-outline-variant/40 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={coverPhoto.url}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleDelete(coverPhoto.id)}
                                    disabled={deletingId === coverPhoto.id}
                                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-on-surface/70 backdrop-blur-sm text-on-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-error"
                                    aria-label="Delete cover photo"
                                >
                                    <Icon name={deletingId === coverPhoto.id ? 'progress_activity' : 'delete'} size={18} className={deletingId === coverPhoto.id ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Other photos */}
                    {otherPhotos.length > 0 && (
                        <div>
                            <h4 className="font-display text-lg font-semibold text-on-surface mb-3">
                                Additional Photos
                                <span className="ml-2 font-mono text-sm font-normal text-on-surface-variant">({otherPhotos.length})</span>
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {otherPhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-outline-variant/40 group bg-surface-container"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.url}
                                            alt="Facility"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => handleDelete(photo.id)}
                                            disabled={deletingId === photo.id}
                                            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-on-surface/70 backdrop-blur-sm text-on-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-error"
                                            aria-label="Delete photo"
                                        >
                                            <Icon
                                                name={deletingId === photo.id ? 'progress_activity' : 'delete'}
                                                size={16}
                                                className={deletingId === photo.id ? 'animate-spin' : ''}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
