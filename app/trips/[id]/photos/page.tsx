'use client';

import { use, useState, useRef } from 'react';
import { notFound } from 'next/navigation';
import MobileShell from '@/components/MobileShell';
import BackButton from '@/components/BackButton';
import { useTrips } from '@/context/TripsContext';
import { useLang } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';

const PHOTO_EMOJIS = ['📸','🌅','🏖️','⛩️','🗼','🌸','🍣','🎎','🏔️','🌊','🍷','🏰','🎡','🛶','🌺'];
const PHOTO_BGS = ['#dbeafe','#fef3c7','#dcfce7','#fce7f3','#ede9fe','#fee2e2','#e0f2fe','#fef9c3','#f0fdf4'];

export default function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getTrip, addPhoto, removePhoto } = useTrips();
  const trip = getTrip(id);
  if (!trip) notFound();

  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📸');
  const [selectedBg, setSelectedBg] = useState(PHOTO_BGS[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploading(true);

    try {
      let url = '';
      let storagePath: string | undefined;

      if (selectedFile) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const ext = selectedFile.name.split('.').pop();
        const path = `${user?.id ?? 'anon'}/${id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('trip-photos')
          .upload(path, selectedFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('trip-photos').getPublicUrl(path);
        url = data.publicUrl;
        storagePath = path;
      }

      await addPhoto(id, {
        url,
        storagePath,
        emoji: selectedEmoji,
        caption: caption.trim() || 'Untitled',
        uploadedBy: 'Me',
        uploadedAt: new Date().toISOString().slice(0, 10),
        bg: selectedBg,
      });

      setCaption('');
      setPreviewUrl(null);
      setSelectedFile(null);
      setShowForm(false);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <MobileShell>
      <div className="flex items-center gap-3 px-5 pt-2 pb-3 flex-shrink-0">
        <BackButton href={`/trips/${id}`} />
        <h1 className="text-xl font-semibold text-gray-900 flex-1">{t('photos')}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-9 h-9 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Add photo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-blue-50 rounded-2xl p-4 mb-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-blue-900">{t('addPhoto')}</p>

            {/* File upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-blue-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors overflow-hidden"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <svg className="w-7 h-7 text-blue-300 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                  <p className="text-xs text-blue-400">Tap to choose a photo</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Fallback emoji if no file */}
            {!selectedFile && (
              <>
                <p className="text-xs text-gray-500">Or choose an emoji instead</p>
                <div className="flex flex-wrap gap-2">
                  {PHOTO_EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setSelectedEmoji(e)}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${selectedEmoji === e ? 'ring-2 ring-blue-400 bg-white' : 'bg-white/60 hover:bg-white'}`}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {PHOTO_BGS.map((c) => (
                    <button key={c} type="button" onClick={() => setSelectedBg(c)}
                      className={`w-7 h-7 rounded-full transition-all ${selectedBg === c ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </>
            )}

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full rounded-xl border border-blue-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />

            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

            <div className="flex gap-2">
              <button type="submit" disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-60">
                {uploading ? 'Uploading…' : t('add')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setPreviewUrl(null); setSelectedFile(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {trip.photos.length} photo{trip.photos.length !== 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {trip.photos.map((ph) => (
            <div key={ph.id} className="relative group">
              {ph.url ? (
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img src={ph.url} alt={ph.caption} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square rounded-2xl flex items-center justify-center text-5xl" style={{ backgroundColor: ph.bg }}>
                  {ph.emoji}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/30 rounded-b-2xl p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{ph.caption}</p>
                <p className="text-white/70 text-[10px]">{ph.uploadedBy}</p>
              </div>
              <button
                onClick={() => removePhoto(id, ph.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label="Delete photo"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          ))}

          <button
            onClick={() => setShowForm(true)}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span className="text-xs">{t('addPhoto')}</span>
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
