"use client";

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Search, 
  Copy, 
  Check, 
  Download, 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock,
  Layers,
  FileText,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AdminDashboardProps {
  authToken: string;
  onClose: () => void;
}

export default function AdminDashboard({ authToken, onClose }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});

  const fetchSubmissions = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/submissions', {
        headers: {
          'Authorization': authToken
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissions(data.submissions || []);
        // Expand the first submission by default if exists
        if (data.submissions && data.submissions.length > 0) {
          setExpandedSubmissions({ [data.submissions[0].id]: true });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch records');
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'An error occurred while fetching database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const toggleExpand = (id: string) => {
    setExpandedSubmissions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const downloadImage = async (url: string, filename: string) => {
    if (!url || url.startsWith('[')) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'cloudinary-download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Blob download failed, falling back to open in tab', err);
      window.open(url, '_blank');
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const query = searchQuery.toLowerCase();
    return (
      sub.businessName?.toLowerCase().includes(query) ||
      sub.businessCategory?.toLowerCase().includes(query) ||
      sub.businessMobile?.toLowerCase().includes(query) ||
      sub.pincode?.toLowerCase().includes(query) ||
      sub.ownerName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md">
      {/* Outer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Client Submissions Portal</h2>
              <p className="text-xs text-slate-400">View and manage collected Google Business Profile details.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* LOGGED IN VIEW */}
          <div className="space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by business name, category, mobile number or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all w-full"
              />
            </div>

            {/* Status Indicator */}
            {loading && (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-sm text-slate-400">Loading submissions from database...</span>
              </div>
            )}

            {fetchError && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-start gap-3 max-w-xl mx-auto">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-300">Fetch Failed: </span>
                  {fetchError}
                  <button 
                    onClick={fetchSubmissions}
                    className="text-xs underline text-indigo-400 hover:text-indigo-300 block mt-2 font-semibold"
                  >
                    Retry Query
                  </button>
                </div>
              </div>
            )}

              {!loading && !fetchError && filteredSubmissions.length === 0 && (
                <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                  <AlertCircle className="w-8 h-8 text-slate-655 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No submissions found matching your query.</p>
                </div>
              )}

              {/* List of submissions */}
              {!loading && !fetchError && filteredSubmissions.length > 0 && (
                <div className="space-y-4">
                  {filteredSubmissions.map((sub) => {
                    const isExpanded = !!expandedSubmissions[sub.id];
                    const dateStr = sub.submittedAt 
                      ? new Date(sub.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
                      : 'Unknown Date';
                    
                    return (
                      <div 
                        key={sub.id} 
                        className="bg-slate-950/40 border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-800 transition-all"
                      >
                        {/* Header Box */}
                        <div 
                          onClick={() => toggleExpand(sub.id)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-900/30 transition-colors select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{sub.businessName}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{sub.businessCategory} • Mobile: {sub.businessMobile}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 sm:mt-0 justify-between">
                            <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded font-mono">
                              {dateStr}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="border-t border-slate-900 p-5 space-y-6 bg-slate-900/10">
                            
                            {/* Section 1: Business details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Business Info</h5>
                                <div className="space-y-2.5 text-xs">
                                  {renderDetailRow("Name", sub.businessName, `sub-${sub.id}-name`)}
                                  {renderDetailRow("Category", sub.businessCategory, `sub-${sub.id}-cat`)}
                                  {renderDetailRow("Start Year", sub.businessStartYear, `sub-${sub.id}-year`)}
                                  {renderDetailRow("Hours", sub.businessWorkingHours, `sub-${sub.id}-hours`)}
                                  {renderDetailRow("Services", sub.productsServices, `sub-${sub.id}-services`)}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Description</h5>
                                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 text-xs text-slate-300 relative group pr-10 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                  {sub.businessDescription}
                                  <button 
                                    onClick={() => handleCopy(sub.businessDescription, `sub-${sub.id}-desc`)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                                    title="Copy Description"
                                  >
                                    {copiedField === `sub-${sub.id}-desc` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Contact & Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-900/60">
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Contact & Accounts</h5>
                                <div className="space-y-2.5 text-xs">
                                  {renderDetailRow("Mobile", sub.businessMobile, `sub-${sub.id}-mob`)}
                                  {renderDetailRow("WhatsApp", sub.whatsappNumber, `sub-${sub.id}-wa`)}
                                  {renderDetailRow("Alt Contact", sub.alternateContact || 'N/A', `sub-${sub.id}-alt`)}
                                  
                                  {sub.hasBusinessGmail ? (
                                    renderDetailRow("Gmail ID", sub.businessGmail, `sub-${sub.id}-gmail`)
                                  ) : (
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 space-y-2 text-[11px] text-slate-350">
                                      <div className="font-semibold text-indigo-400 flex items-center gap-1.5">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Create New Gmail:</span>
                                      </div>
                                      {renderDetailRow("Owner Name", sub.ownerName, `sub-${sub.id}-own`)}
                                      {renderDetailRow("Owner Mobile", sub.ownerMobile, `sub-${sub.id}-ownmob`)}
                                      {renderDetailRow("Owner DOB", sub.ownerDOB, `sub-${sub.id}-owndob`)}
                                      {renderDetailRow("Recovery Mobile", sub.recoveryMobile, `sub-${sub.id}-rec`)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Location details</h5>
                                <div className="space-y-2.5 text-xs">
                                  {renderDetailRow("Pincode", sub.pincode, `sub-${sub.id}-pin`)}
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-450 font-medium">Maps Location Link:</span>
                                      <a 
                                        href={sub.googleMapsLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-[11px]"
                                      >
                                        <span>View Map</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                    <div className="relative group flex items-center bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                                      <span className="text-slate-300 pr-10 truncate text-[11px] w-full font-mono">{sub.googleMapsLink}</span>
                                      <button 
                                        onClick={() => handleCopy(sub.googleMapsLink, `sub-${sub.id}-maplink`)}
                                        className="absolute right-1.5 p-1 bg-slate-900 text-slate-400 hover:text-white rounded"
                                      >
                                        {copiedField === `sub-${sub.id}-maplink` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </div>
                                  {renderDetailRow("Full Address", sub.completeAddress, `sub-${sub.id}-addr`)}
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Additional Configurations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-900/60">
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Additional Parameters</h5>
                                <div className="space-y-2.5 text-xs">
                                  {renderDetailRow("GST Number", sub.gstNumber || 'Not Provided', `sub-${sub.id}-gst`)}
                                  {renderDetailRow("Website URL", sub.websiteUrl || 'Not Provided', `sub-${sub.id}-web`)}
                                  {renderDetailRow("Facebook", sub.facebookLink || 'Not Provided', `sub-${sub.id}-fb`)}
                                  {renderDetailRow("Instagram", sub.instagramLink || 'Not Provided', `sub-${sub.id}-ig`)}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Transactional Options</h5>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${sub.upiAvailable ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-slate-950/40 border-slate-900 text-slate-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sub.upiAvailable ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                    <span>UPI Payments</span>
                                  </div>
                                  <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${sub.homeDelivery ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-slate-950/40 border-slate-900 text-slate-500'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${sub.homeDelivery ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                    <span>Home Delivery</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Uploaded Photos */}
                            {sub.images && Object.keys(sub.images).length > 0 && (
                              <div className="pt-4 border-t border-slate-900/60 space-y-4">
                                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Uploaded Photos</h5>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                  {Object.entries(sub.images).map(([labelKey, urlOrList]: [string, any]) => {
                                    const title = labelKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                    
                                    if (Array.isArray(urlOrList)) {
                                      return urlOrList.map((imgUrl: string, idx: number) => (
                                        <PhotoWidget 
                                          key={`${labelKey}-${idx}`}
                                          title={`${title} ${idx + 1}`}
                                          url={imgUrl}
                                          onDownload={() => downloadImage(imgUrl, `${sub.businessName.replace(/\s+/g, '_')}_${labelKey}_${idx + 1}.jpg`)}
                                        />
                                      ));
                                    } else {
                                      return (
                                        <PhotoWidget 
                                          key={labelKey}
                                          title={title}
                                          url={urlOrList}
                                          onDownload={() => downloadImage(urlOrList, `${sub.businessName.replace(/\s+/g, '_')}_${labelKey}.jpg`)}
                                        />
                                      );
                                    }
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          
        </div>
      </div>
    </div>
  );

  // Small detail row with a copy button
  function renderDetailRow(label: string, value: string, fieldId: string) {
    const isCopyable = value && value !== 'N/A' && value !== 'Not Provided';
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-xl bg-slate-950/40 border border-slate-900 relative group pr-10">
        <div className="flex items-center gap-2">
          <span className="text-slate-450 font-medium">{label}:</span>
          <span className="text-slate-200 select-all">{value}</span>
        </div>
        {isCopyable && (
          <button 
            type="button"
            onClick={() => handleCopy(value, fieldId)}
            className="absolute right-2 top-2 sm:top-1.5 p-1 rounded bg-slate-900 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
            title={`Copy ${label}`}
          >
            {copiedField === fieldId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    );
  }
}

// Photo Widget inside the dashboard
interface PhotoWidgetProps {
  title: string;
  url: string;
  onDownload: () => void;
}

function PhotoWidget({ title, url, onDownload }: PhotoWidgetProps) {
  const isCloudinary = url && !url.includes('[Attached Locally]') && !url.includes('[Local Image]');
  
  return (
    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex flex-col items-center text-center gap-2 relative group overflow-hidden">
      <span className="text-[10px] font-bold text-slate-400 block truncate max-w-full mb-1">{title}</span>
      
      {isCloudinary ? (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
          <img 
            src={url} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Download & External links overlays */}
          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={onDownload}
              className="p-1.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg shadow cursor-pointer transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg shadow cursor-pointer transition-colors"
              title="Open full size"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full rounded-lg bg-slate-900/60 border border-slate-850 flex flex-col items-center justify-center text-center gap-1.5 p-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <span className="text-[9px] font-semibold text-slate-450 leading-tight">Image Attached Locally</span>
        </div>
      )}
    </div>
  );
}
